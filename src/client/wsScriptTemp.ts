export default `
<script>
    const ws = new WebSocket(
        \`\$\{window.location.protocol === 'http:' ? 'ws' : 'wss'\}://\$\{window.location.host\}/ws\`
    )

    ws.onmessage = function(e) {
        if(e.data === 'reload') {
            window.location.reload()
        }
    }
</script>
`