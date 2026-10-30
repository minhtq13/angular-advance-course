# syntax=docker/dockerfile:1
# Build trong container -> học viên không cần cài JDK/Maven.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
# Cache ~/.m2 giữa các lần build (BuildKit) -> lần sau không tải lại dependency.
# Không dùng dependency:go-offline: lệnh này resolve cả plugin không cần thiết, dễ treo/lỗi.
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/care-api-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
