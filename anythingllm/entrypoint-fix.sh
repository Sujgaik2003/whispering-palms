#!/bin/bash
# Create user if it doesn't exist
if ! id -u anythingllm &>/dev/null; then
    groupadd -g 1000 anythingllm 2>/dev/null || true
    useradd -u 1000 -g 1000 -m anythingllm 2>/dev/null || true
fi

# Fix permissions
chown -R anythingllm:anythingllm /app/server/storage 2>/dev/null || true

# Execute original entrypoint as anythingllm user
exec su - anythingllm -c '/usr/local/bin/docker-entrypoint.sh' || exec /usr/local/bin/docker-entrypoint.sh
