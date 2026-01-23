package com.pawzzle.web;

import com.baidu.aip.speech.AipSpeech;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
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
    private final String APP_ID;
    private final String API_KEY;
    private final String SECRET_KEY;
    private final AipSpeech client;

    public BaiduVoiceController(
        @Value("${baidu.voice.app-id}") String appId,
        @Value("${baidu.voice.api-key}") String apiKey,
        @Value("${baidu.voice.secret-key}") String secretKey
    ) {
        this.APP_ID = appId;
        this.API_KEY = apiKey;
        this.SECRET_KEY = secretKey;
        this.client = new AipSpeech(APP_ID, API_KEY, SECRET_KEY);
    }

    @PostMapping(value = "/api/voice/transcribe-baidu", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> transcribeBaidu(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Empty audio file"));
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Failed to read audio file"));
        }

        HashMap<String, Object> options = new HashMap<>();
        options.put("dev_pid", 1537);

        JSONObject response = client.asr(bytes, "m4a", 16000, options);
        int errNo = response.optInt("err_no", -1);
        if (errNo != 0) {
            String errMsg = response.optString("err_msg", "Baidu ASR error");
            Map<String, Object> body = new HashMap<>();
            body.put("error", errMsg);
            body.put("err_no", errNo);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }

        JSONArray result = response.optJSONArray("result");
        String text = "";
        if (result != null && result.length() > 0) {
            text = result.optString(0, "");
        }

        return ResponseEntity.ok(Map.of("text", text));
    }
}
