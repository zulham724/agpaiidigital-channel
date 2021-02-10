var express = require('express');
var router = express.Router();

router.get('/socket/test', function(req, res) {
    /* 
      do stuff to update the foo resource 
      ...
     */
    res.render('index', { title: 'asd' })
        // now broadcast the updated foo..
    req.io.emit('test', 'anjay');
});
router.get('/socket/test2', function(req, res) {
    /* 
      do stuff to update the foo resource 
      ...
     */
    res.render('index', { title: 'kirim pesan' })
        // now broadcast the updated foo..
    req.io.to('personal_conversation_29').emit("message", 'kirim pesan ke personal_conversation_29');
});
// return router;


module.exports = router;