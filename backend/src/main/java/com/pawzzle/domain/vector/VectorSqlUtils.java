package com.pawzzle.domain.vector;

import java.util.List;
import java.util.stream.Collectors;

public final class VectorSqlUtils {
    private VectorSqlUtils() {
    }

    public static String toVector(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return "[]";
        }
        return values.stream()
            .map(value -> value == null ? "0" : value.toString())
            .collect(Collectors.joining(",", "[", "]"));
    }
}
