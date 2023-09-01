export default `
<script>
    const ws = new WebSocket("<%= url %>")

    ws.onmessage = function(e) {
        if(e.data === 'reload') {
            window.location.reload()
        }
    }
</script>
`