const { default: axios } = require("axios");
require('dotenv').config()

const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIyIiwianRpIjoiZTIxYzY0ZDE5ODU2NGQwOWY5YTI5N2RhZmU0MzdlNTU3NzA4OTUwNzg5OTA4YmM2YmE4MDljNzgxNGE4MjkxZDI3ODRlNDJiOTgxYmYwOTkiLCJpYXQiOiIxNjEzNTI0MTUxLjIwMTc2MSIsIm5iZiI6IjE2MTM1MjQxNTEuMjAxNzY1IiwiZXhwIjoiMTY0NTA2MDE1MS4xOTEyMTciLCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.T-HJoNGtHs5hgAUwQ-4us_nNQCq3JYdEuCKJYpiapEfYcrwY26X_pSIUroE8dNvbX5wv79vFRyrb3mEcTw0-6JL7ini3_nBwwAx-ai7mXVkKCouo4gMJqGHw1Qw-gcQ20vq0ahdoUWXhCFWqhpmzDurxjvhnh2glQFCftj_qcwSswdXJOhfq7S6DFbwnDnrLmFe8O6pkuUwZcxaz6cG0IjIh9PEWPSQg-SthrsIPpVD_sxuYBaZd_wl1FpcH4ldjMkV9Qtnqs4VXldtoEWJm35hczofWqVYpMuYali1419Wc27itfMYRffX92NzbghhG3KGtlxLmf_Nx0dymcHywiEl5dum9YvklzdT-dpQijSOsguEIlcLJkkaTWrrRUJXijgD414zDsYHplh4QaegbIPZgiQPr-O-QafWSBKbE6YqphXFMVIcQ4bw00ZUFBROEF_cc7uFL9T2HIafDTmeChbUmbXRu6u6gidw4GN1nahVpy0F52nLUYfo-e6t8FJKLIva7h-usMDp70m92tRfyAUWkOaxo5d9qRJFBnwndOLx23I_v5yCN5PDx45CSY5apL2uuAYlYWSlwsrmXoeNFCID-4_ykBO4veYt7MRKN_Ky6MyvYYANpZetpPTIuDkOksFa78czl7iIUyQAAJTHJp6lgzc91ok89lQyER1xEgiY';
const updateUrl = "http://localhost:8000/api/v1/conversation/50";
const a = new Date().getTime();
axios
    .put(updateUrl, {conversation:1}, {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
    })
    .then((res) => {
        console.log(res.data);
    })
    .catch((err) => {
        console.log("error update data:", err.message);
    });
console.log('star axios');
// const a = new Date().getT
// console.log(a);