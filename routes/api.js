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
// return router;


module.exports = router;