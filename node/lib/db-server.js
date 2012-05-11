
var common = require('./common')
var api    = require('./db-rest-api')


var connect = common.connect



function init() {
  var server = connect.createServer()
  server.use( connect.logger() )
  server.use( connect.bodyParser() )
  server.use( connect.query() )

  server.use( function( req, res, next ) {
    res.sendjson$ = function( obj ) {
      common.sendjson( res, obj )
    }

    res.send$ = function( code, text ) {
      res.writeHead( code, ''+text )
      res.end()
    }

    res.err$ = function(win) {
      return function( err, output ) {
        if( err ) {
          console.log(err)
          res.send$(500, err)
        }
        else {
        	console.log(win)
          win && win(output)
        }
      }
    }

    next()
  })

  var router = connect.router( function( app ) {
    app.get('/api/ping', api.ping)
    app.get('/api/echo', api.echo)
    app.post('/api/echo', api.echo)

    app.post('/api/rest/item',    api.rest.create)
    app.get('/api/rest/item/:id', api.rest.read)
    app.get('/api/rest/item',     api.rest.list)
    app.put('/api/rest/item/:id', api.rest.update)
    app.del('/api/rest/item/:id', api.rest.del)
    app.get('/api/rest/geolist', api.rest.geolist)
  })
  server.use(router)

  server.use( connect.static( __dirname + '/../../site/public') )


  api.connect(
    {
      name:   'assignment2',
      server: '127.0.0.1',
      port:   27017,
    },
    function(err){
      if( err ) return console.log(err);
      
      server.listen(8180)
    }
  )
}


init()