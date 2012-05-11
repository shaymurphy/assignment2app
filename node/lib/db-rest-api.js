// API implementation

var common = require('./common')

var uuid = common.uuid
var mongodb = common.mongodb

var itemcoll = null

var util = {}

util.validate = function(input) {
	return input.text
}

util.fixid = function(doc) {
	if(doc._id) {
		doc.id = doc._id.toString()
		delete doc._id
	} else if(doc.id) {
		doc._id = new mongodb.ObjectID(doc.id)
		delete doc.id
	}
	return doc
}

exports.ping = function(req, res) {
	var output = {
		ok : true,
		time : new Date()
	}
	res.sendjson$(output)
}

exports.echo = function(req, res) {
	var output = req.query

	if('POST' == req.method) {
		output = req.body
	}

	res.sendjson$(output)
}

exports.rest = {

	create : function(req, res) {
		var input = req.body

		if(!util.validate(input)) {
			return res.send$(400, 'invalid')
		}

		var item = {
			text : input.text,
			rating : input.rating,
			category : input.category,
			description : input.description,
			mylocation : input.mylocation,
			created : new Date().getTime(),
		}

		itemcoll.insert(item, res.err$( function(docs) {
			var output = util.fixid(docs[0])
			res.sendjson$(output)
		}))
	},
	read : function(req, res) {
		var input = req.params

		console.log(req.params)

		var query = util.fixid({
			id : input.id
		})
		itemcoll.findOne(query, res.err$(function(doc) {
			if(doc) {
				var output = util.fixid(doc)
				res.sendjson$(output)
			} else {
				res.send$(404, 'not found')
			}
		}))
	},
	list : function(req, res) {
		var input = req.query
		var output = []
		console.log('in the list')
		var query = {}
		var options = {
			sort : [['created', 'desc']]
		}

		itemcoll.find(query, options, res.err$(function(cursor) {
			cursor.toArray(res.err$(function(docs) {
				output = docs
				output.forEach(function(item) {
					util.fixid(item)
				})
				res.sendjson$(output)
			}))
		}))
	},
	geolist : function(req, res) {
		var input = req.query
		var output = []
		console.log('in the geolist '+req.params)
		var query = {
			mylocation: {$near : [input.x,input.y]}
		}
		var options = {}

		itemcoll.find(query, res.err$(function(cursor) {
			cursor.toArray(res.err$(function(docs) {
				output = docs
				output.forEach(function(item) {
					util.fixid(item)
				})
				res.sendjson$(output)
			}))
		}))
	},
	update : function(req, res) {
		var id = req.params.id
		var input = req.body

		if(!util.validate(input)) {
			return res.send$(400, 'invalid')
		}

		var query = util.fixid({
			id : id
		})
		itemcoll.update(query, {
			$set : {
				text : input.text
			}
		}, res.err$(function(count) {
			if(0 < count) {
				var output = util.fixid(doc)
				res.sendjson$(output)
			} else {
				console.log('404')
				res.send$(404, 'not found')
			}
		}))
	},
	del : function(req, res) {
		var input = req.params

		var query = util.fixid({
			id : input.id
		})
		itemcoll.remove(query, res.err$(function() {
			var output = {}
			res.sendjson$(output)
		}))
	}
}

exports.connect = function(options, callback) {
	var client = new mongodb.Db(options.name, new mongodb.Server(options.server, options.port, {}))
	client.open(function(err, client) {
		if(err)
			return callback(err);

		client.collection('item', function(err, collection) {
			if(err)
				return callback(err);
			itemcoll = collection
			itemcoll.ensureIndex( { mylocation : "2d" } )
			callback()
		})
	})
}