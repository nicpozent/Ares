# ---- build ----------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Ares.Api/Ares.Api.csproj Ares.Api/
RUN dotnet restore Ares.Api/Ares.Api.csproj
COPY . .
RUN dotnet publish Ares.Api/Ares.Api.csproj -c Release -o /app /p:UseAppHost=false

# ---- runtime --------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app .
ENTRYPOINT ["dotnet", "Ares.Api.dll"]
