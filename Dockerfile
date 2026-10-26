FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y ffmpeg python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY comp-chunk-* ./
RUN cat comp-chunk-*.mp4 > loop.mp4 && rm comp-chunk-*.mp4
COPY stream.sh stream.sh
RUN chmod +x stream.sh
CMD ["./stream.sh"]
