# ---- Build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# ---- Run ----
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN useradd --system --uid 1001 appuser
USER appuser

COPY --from=build /app/target/finance-gaming-backend-0.0.1-SNAPSHOT.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
