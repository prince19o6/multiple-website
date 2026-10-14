# ==============================================================================
# Multi-stage Dockerfile for ASP.NET Core 8.0 Multi-Tenant Backend API
# ==============================================================================

# --- Stage 1: Build & Publish ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY toursApi/ToursApi.csproj toursApi/
RUN dotnet restore toursApi/ToursApi.csproj

# Copy full source and publish
COPY toursApi/ toursApi/
WORKDIR /src/toursApi
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# --- Stage 2: Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Copy published binaries
COPY --from=build /app/publish .

# Expose HTTP port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

ENTRYPOINT ["dotnet", "ToursApi.dll"]
