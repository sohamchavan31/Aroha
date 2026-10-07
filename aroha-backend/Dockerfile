# Aroha backend — Spring Boot 3 on Java 17.
# Stage 1 builds the jar with Maven, stage 2 runs it on a small JRE image.
# Build:  docker build -t aroha-backend ./aroha-backend
# Run:    docker run --env-file aroha-backend/.env -p 8080:8080 aroha-backend

# ── Build ────────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Dependencies first, so code-only changes reuse this cached layer.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B package -DskipTests

# ── Run ──────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S aroha && adduser -S aroha -G aroha
COPY --from=build /app/target/*.jar app.jar
USER aroha

# Hosts like Render pass PORT; locally it stays 8080.
ENV PORT=8080
EXPOSE 8080

# Keep the heap inside the container's memory limit (Render free = 512 MB).
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
