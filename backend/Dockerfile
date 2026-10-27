# syntax=docker/dockerfile:1
# Build trong container -> hoc vien khong can cai JDK/Maven.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
# Cache ~/.m2 giua cac lan build (BuildKit) -> lan sau khong tai lai dependency.
# Khong dung dependency:go-offline: lenh nay resolve ca plugin khong can thiet, de treo/loi.
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/care-api-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
