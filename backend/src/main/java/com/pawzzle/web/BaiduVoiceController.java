package com.pawzzle.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class BaiduVoiceController {
    private static final long MAX_AUDIO_BYTES = 5 * 1024 * 1024;
    private static final String TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
    private static final String ASR_URL = "https://vop.baidu.com/server_api";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String secretKey;
    private final int devPid;
    private final int sampleRate;
    private final String cuid;

    private volatile String cachedToken;
    private volatile long tokenExpireEpochSeconds;

    public BaiduVoiceController(
        ObjectMapper objectMapper,
        @Value("${baidu.voice.api-key}") String apiKey,
        @Value("${baidu.voice.secret-key}") String secretKey,
        @Value("${baidu.voice.dev-pid:1537}") int devPid,
        @Value("${baidu.voice.sample-rate:16000}") int sampleRate,
        @Value("${baidu.voice.cuid:pawzzle-client}") String cuid
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.devPid = devPid;
        this.sampleRate = sampleRate;
        this.cuid = cuid == null ? "pawzzle-client" : cuid.trim();
    }

    @PostMapping(
        value = { "/api/voice/transcribe", "/api/voice/transcribe-baidu" },
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, Object>> transcribe(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Empty audio file"));
        }
        if (!credentialsReady()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Baidu voice api-key/secret-key are not configured"));
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to read audio file"));
        }
        if (bytes.length == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Empty audio payload"));
        }
        if (bytes.length > MAX_AUDIO_BYTES) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Audio file is too large"));
        }

        String format = resolveVoiceFormat(file.getOriginalFilename(), file.getContentType());
        return transcribeAudio(bytes, format);
    }

    @PostMapping("/api/voice/transcribe-test-file")
    public ResponseEntity<Map<String, Object>> transcribeTestFile() {
        if (!credentialsReady()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Baidu voice api-key/secret-key are not configured"));
        }

        Path testFile = resolveTestAudioFile();
        if (testFile == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "error", "test.m4a not found in project root",
                    "checkedPaths", resolveCandidatePaths()
                )
            );
        }

        byte[] bytes;
        try {
            bytes = Files.readAllBytes(testFile);
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to read test.m4a", "path", testFile.toString()));
        }
        if (bytes.length == 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "test.m4a is empty", "path", testFile.toString()));
        }
        if (bytes.length > MAX_AUDIO_BYTES) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "test.m4a is too large", "path", testFile.toString()));
        }

        ResponseEntity<Map<String, Object>> result = transcribeAudio(bytes, "m4a");
        if (!result.getStatusCode().is2xxSuccessful() || result.getBody() == null) {
            return result;
        }

        Map<String, Object> body = new HashMap<>(result.getBody());
        body.put("path", testFile.toString());
        return ResponseEntity.ok(body);
    }

    private ResponseEntity<Map<String, Object>> transcribeAudio(byte[] bytes, String format) {
        try {
            String token = getAccessToken();
            Map<String, Object> payload = new HashMap<>();
            payload.put("format", format);
            payload.put("rate", sampleRate);
            payload.put("channel", 1);
            payload.put("cuid", cuid);
            payload.put("token", token);
            payload.put("dev_pid", devPid);
            payload.put("speech", Base64.getEncoder().encodeToString(bytes));
            payload.put("len", bytes.length);

            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ASR_URL))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            int errNo = root.path("err_no").asInt(-1);
            if (errNo != 0) {
                String error = root.path("err_msg").asText("Baidu ASR error");
                Map<String, Object> body = new HashMap<>();
                body.put("error", error);
                body.put("err_no", errNo);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
            }

            JsonNode resultNode = root.path("result");
            String text = "";
            if (resultNode.isArray() && resultNode.size() > 0) {
                text = resultNode.get(0).asText("");
            }
            return ResponseEntity.ok(Map.of("text", text.trim()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", exception.getMessage() == null ? "Baidu ASR request failed" : exception.getMessage()));
        }
    }

    private synchronized String getAccessToken() throws Exception {
        long now = System.currentTimeMillis() / 1000;
        if (cachedToken != null && now < tokenExpireEpochSeconds - 120) {
            return cachedToken;
        }

        String query = "grant_type=client_credentials&client_id="
            + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
            + "&client_secret="
            + URLEncoder.encode(secretKey, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(TOKEN_URL + "?" + query))
            .timeout(Duration.ofSeconds(15))
            .POST(HttpRequest.BodyPublishers.noBody())
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());
        String accessToken = root.path("access_token").asText("");
        if (accessToken.isBlank()) {
            throw new IllegalStateException(root.path("error_description").asText("Failed to get Baidu access_token"));
        }
        long expiresIn = root.path("expires_in").asLong(0L);
        cachedToken = accessToken;
        tokenExpireEpochSeconds = (System.currentTimeMillis() / 1000) + Math.max(expiresIn, 60);
        return cachedToken;
    }

    private boolean credentialsReady() {
        return !apiKey.isEmpty() && !secretKey.isEmpty();
    }

    private Path resolveTestAudioFile() {
        for (String candidate : resolveCandidatePaths()) {
            Path path = Path.of(candidate);
            if (Files.exists(path) && Files.isRegularFile(path)) {
                return path;
            }
        }
        return null;
    }

    private List<String> resolveCandidatePaths() {
        String cwd = System.getProperty("user.dir", "");
        List<String> candidates = new ArrayList<>();
        if (!cwd.isBlank()) {
            candidates.add(Path.of(cwd, "test.m4a").toString());
            candidates.add(Path.of(cwd).resolve("..").resolve("test.m4a").normalize().toString());
        }
        return candidates;
    }

    private String resolveVoiceFormat(String filename, String contentType) {
        if (filename != null) {
            int dot = filename.lastIndexOf('.');
            if (dot > -1 && dot + 1 < filename.length()) {
                String extension = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
                String normalized = normalizeFormat(extension);
                if (normalized != null) {
                    return normalized;
                }
            }
        }
        if (contentType != null) {
            String lower = contentType.toLowerCase(Locale.ROOT);
            if (lower.contains("wav")) {
                return "wav";
            }
            if (lower.contains("mpeg") || lower.contains("mp3")) {
                return "mp3";
            }
            if (lower.contains("amr")) {
                return "amr";
            }
            if (lower.contains("m4a") || lower.contains("mp4")) {
                return "m4a";
            }
            if (lower.contains("pcm")) {
                return "pcm";
            }
        }
        return "m4a";
    }

    private String normalizeFormat(String extension) {
        return switch (extension) {
            case "wav", "pcm", "amr", "m4a", "mp3" -> extension;
            case "x-wav" -> "wav";
            case "x-m4a", "mp4" -> "m4a";
            default -> null;
        };
    }
}
