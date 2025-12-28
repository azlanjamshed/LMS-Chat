const express = require("express")

const app = express()

app.get("/", (req, res) => {
    res.send('🚀 LMS Chat Server Running! Day 1 Success!')
})

app.listen(8080, () => {
    console.log("Server started at port 8080");

})