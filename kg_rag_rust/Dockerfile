# 构建阶段
FROM rust:1.80-slim AS builder
WORKDIR /build
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

# 运行阶段(轻量)
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /build/target/release/kg_rag_rust /usr/local/bin/kg_rag_rust
ENTRYPOINT ["kg_rag_rust"]
