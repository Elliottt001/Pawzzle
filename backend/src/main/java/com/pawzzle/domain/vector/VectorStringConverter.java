package com.pawzzle.domain.vector;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Converter(autoApply = false)
public class VectorStringConverter implements AttributeConverter<List<Double>, String> {
    @Override
    public String convertToDatabaseColumn(List<Double> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        return attribute.stream()
            .map(value -> value == null ? "0" : value.toString())
            .collect(Collectors.joining(",", "[", "]"));
    }

    @Override
    public List<Double> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        String trimmed = dbData.trim();
        if (trimmed.startsWith("[")) {
            trimmed = trimmed.substring(1);
        }
        if (trimmed.endsWith("]")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return new ArrayList<>();
        }
        String[] parts = trimmed.split(",");
        List<Double> values = new ArrayList<>(parts.length);
        for (String part : parts) {
            String p = part.trim();
            if (!p.isEmpty()) {
                values.add(Double.parseDouble(p));
            }
        }
        return values;
    }
}
