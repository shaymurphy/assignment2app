

var i = 0

var app = {
    model: {},
    view: {},
    tabs: {
        recent: {
            index: i++,
			icon: '40-inbox'
        },
        top: {
            index: i++,
            icon: '28-star'
        },
        nearby: {
            index: i++,
			icon: '73-radar'
        }
    },
    platform: /Android/.test(navigator.userAgent) ? 'android' : 'ios',
    initialtab: 'recent'
}




_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{-(.+?)\}\}/g,
    evaluate: /\{\{=(.+?)\}\}/g
};

/*
 * function to create images for rating
 */
$.fn.stars = function(){
    return $(this).each(function(){
        var val = parseFloat($(this).html())
        Math.round(val * 2) / 2
        // Make sure that the value is in 0 - 5 range, multiply to get width
        var size = Math.max(0, (Math.min(5, val))) * 16;
        // Create stars holder
        var $span = $('<span />').width(size);
        // Replace the numerical value with stars
        $(this).html($span);
    });
}

var bb = {
    model: {},
    view: {}
}


bb.init = function(){

    var scrollContent = {
        scroll: function(){
            var self = this
            setTimeout(function(){
                if (self.scroller) {
                    self.scroller.refresh()
                }
                else {
                    self.scroller = new iScroll($("div[data-role='content']")[0])
                }
            }, 1)
        }
    }
    
    bb.model.State = Backbone.Model.extend({
        defaults: {
            current: 'none'
        }
    })
    
    /*
     * Define the model for the item
     */
    bb.model.Item = Backbone.Model.extend(_.extend({
        defaults: {
            text: '',
            mylocation: '',
            description: '',
            rating: 0,
            category: 'None'
        },
        
        initialize: function(){
            var self = this
            _.bindAll(self)
        }
    }))
    
    /*
     * define a list of items and link to restful api
     */
    bb.model.Items = Backbone.Collection.extend(_.extend({
        model: bb.model.Item,
        url: '/api/rest/item',
        
        initialize: function(){
            var self = this
            _.bindAll(self)
            self.count = 0
            
            self.on('reset', function(){
                self.count = self.length
            })
        },
        //TODO: need to pass as an object rather than list of params
        additem: function(itemText, rating, category, description, mylocation){
            var self = this
            var item = new bb.model.Item({
                text: itemText,
                rating: rating,
                category: category,
                description: description,
                mylocation: mylocation
            })
            self.add(item)
            self.count++
            item.save({
                success: function(model){
                    self.add(model)
                    self.count++
                },
                failure: function(){
                    debugger;
                }
            })
        }
    }))
    
    /*
     * Utilize mongo geospatial indexing to return list of items by distance
     * pass x,y corrdinates as url params in the restful api call
     */
    bb.model.NearbyItems = Backbone.Collection.extend(_.extend({
        model: bb.model.Item,
        url: '/api/rest/geolist?x=' + 50 + '&y=' + 50,
        
        initialize: function(){
            var self = this
            _.bindAll(self)
            self.count = 0
            
            self.on('reset', function(){
                self.count = self.length
            })
        }
    }))
    
    /*
     * List view associated to Recent list
     */
    bb.view.List = Backbone.View.extend(_.extend({
        initialize: function(items){
            var self = this
            _.bindAll(self)
            
            self.setElement('#recentlist')
            
            self.items = items
            self.items.on('add', self.appenditem)
        },
        render: function(){
            var self = this
            
            self.$el.empty()
            
            self.items.each(function(item){
                self.appenditem(item)
                
            })
            //render the stars
            $('#recentlist span.stars').stars();
            
        },
        appenditem: function(item){
            var self = this
            
            var itemview = new bb.view.Item({
                model: item
            })
            
            self.$el.append(itemview.render().el)
            self.scroll()
        }
    }, scrollContent))
    
    /*
     * List view associated to Top rated list
     */
    bb.view.TopList = Backbone.View.extend(_.extend({
        initialize: function(items){
            var self = this
            _.bindAll(self)
            
            self.setElement('#toplist')
            
            self.items = items
            self.items.on('add', self.appenditem)
        },
        
        render: function(){
            var self = this
            
            self.$el.empty()
            //sort the list of items for the top rated items
            if (self.items.count > 0) {
                var sortedItems = self.items.sortBy(function(item){
                    return -item.get("rating");
                });
                $.each(sortedItems, (function(i, el){
                    self.appenditem(el)
                    
                }))
            }
            
            //render the stars
            $('#toplist span.stars').stars();
            
        },
        appenditem: function(item){
            var self = this
            
            var itemview = new bb.view.Item({
                model: item
            })
            
            self.$el.append(itemview.render().el)
            
            self.scroll()
        }
        
    }, scrollContent))
    
    /*
     * List view associated to Nearby list
     */
    bb.view.NearbyList = Backbone.View.extend(_.extend({
        initialize: function(items){
            var self = this
            _.bindAll(self)
            
            self.setElement('#nearbylist')
            
            self.items = items
            self.items.on('add', self.appenditem)
        },
        
        render: function(){
            var self = this
            
            self.$el.empty()
            self.items.each(function(item){
                self.appenditem(item)
                
            })
            
            //render the stars
            $('#nearbylist span.stars').stars();
            
        },
        appenditem: function(item){
            var self = this
            
            var itemview = new bb.view.Item({
                model: item
            })
            
            self.$el.append(itemview.render().el)
            
            self.scroll()
        }
        
    }, scrollContent))
    
    /*
     * render each item in the list when added to appended new list
     */
    bb.view.Item = Backbone.View.extend(_.extend({
        tagName: "li",
        template: {
            item: _.template($('#item_tm').html())
        },
        
        events: {
            'tap .li-template': function(){
                var self = this
                var itemdetailview = new bb.view.ItemDetail({
                    model: self.model
                })
                
                $("#content_" + app.model.state.get('current')).hide().removeClass('leftin').removeClass('rightin')
                $("#content_detail").show().addClass('rightin')
                $("#back").toggleClass('hidden');
                
            }
        },
        
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.model.bind('destroy', self.remove, self);
            
            self.elem = {
                item: self.$el.find('#item_tm')
            }
            
        },
        render: function(){
            var self = this
            var html = self.template.item(self.model.toJSON())
            
            self.$el.append(html)
            
            return self
        },
        remove: function(){
            var self = this
            $(self.el).remove()
        }
    }))
    
    /*
     * create an itemdetail when each item is clicked
     */
    bb.view.ItemDetail = Backbone.View.extend(_.extend({
    
        model: bb.model.Item,
        
        template: {
            item_detail: _.template($('#item_detail').html())
        },
        
        events: {},
        
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            
            //debugger;
            self.setElement('#item-detail-placeholder');
            $('#content_detail').bind('hideDetail', self.removeContent);
            self.render()
            
        },
        render: function(){
            var self = this
            //debugger;
            var html = self.template.item_detail(self.model.toJSON())
            
            self.$el.append(html)
            //render the stars
            $('#content_detail span.stars').stars();
            
            return self
        },
        removeContent: function(){
            var self = this
            $('.item-detail-view').remove()
        }
    }, scrollContent))
    
    
    bb.view.Navigation = Backbone.View.extend({
    
        initialize: function(items){
            var self = this
            _.bindAll(self)
            
            self.elem = {
                header: $("#header"),
                footer: $("#footer")
            }
            
            self.elem.header.css({
                zIndex: 1000
            })
            self.elem.footer.css({
                zIndex: 1000
            })
            
            /*
             * Function called when add is clicked
             */
            function handleadd(){
                $(".content").hide().removeClass('leftin').removeClass('rightin');
                $("#content_add").show().addClass('rightin')
                $("#back").toggleClass('hidden');
                $("#save").toggleClass('hidden');
                $("#add").toggleClass('hidden');
                $('#formadd').each (function(){ this.reset();});
            }
            
            /*
             * Function called when save is clicked
             */
            function handlesave(){
                //fetchGeo();
                itemname = $("#itemname").val()
                itemrating = $("#select-rating").val()
                itemcategory = $("#select-category").val()
                itemdescription = $("#itemdescription").val()
                app.model.items.additem(itemname, itemrating, itemcategory, itemdescription, app.mylocation)
                $("#content_add").hide().removeClass('leftin').removeClass('rightin')
                $("#content_" + app.model.state.get('current')).show().addClass('rightin')
                $("#back").toggleClass('hidden');
                $("#save").toggleClass('hidden');
                $("#add").toggleClass('hidden');
            }
            
            /*
             * Function called when back is clicked
             */
            function handleback(){
                $(".content").hide().removeClass('leftin').removeClass('rightin').trigger('hideDetail');
                $("#content_" + app.model.state.get('current')).show().addClass('rightin')
                $("#back").toggleClass('hidden');
                $("#add").show();
                $("#save").hide();
            }
            
            /*
             * Function called when tabbar item is clicked
             */
            function handletab(tabname){
                return function(){
                    app.model.state.set({
                        current: tabname
                    })
                }
            }
            
            var tabindex = 0
            for (var tabname in app.tabs) {
                console.log(tabname)
                $("#tab_" + tabname).tap(handletab(tabname))
            }
            
            app.scrollheight = window.innerHeight - self.elem.header.height() - self.elem.footer.height()
            if ('android' == app.platform) {
                app.scrollheight += self.elem.header.height()
            }
            
            $("#add").tap(handleadd)
            
            $("#save").tap(handlesave)
            
            $("#back").tap(handleback)
        },
        
        render: function(){
        }
    })
    
    
    bb.view.Content = Backbone.View.extend({
        initialize: function(initialtab){
            var self = this
            _.bindAll(self)
            
            self.current = initialtab
            self.scrollers = {}
            
            app.model.state.on('change:current', self.tabchange)
            
            window.onresize = function(){
                self.render()
            }
            
            app.model.state.on('scroll-refresh', function(){
                self.render()
            })
        },
        
        render: function(){
            var self = this
            
            app.view[self.current] && app.view[self.current].render()
            
            var content = $("#content_" + self.current)
            if (!self.scrollers[self.current]) {
                self.scrollers[self.current] = new iScroll("content_" + self.current)
            }
            
            content.height(app.scrollheight)
            
            setTimeout(function(){
                self.scrollers[self.current].refresh()
            }, 300)
        },
        
        tabchange: function(){
            var self = this
            
            var previous = self.current
            var current = app.model.state.get('current')
            console.log('tabchange prev=' + previous + ' cur=' + current)
            
            $("#content_" + previous).hide().removeClass('leftin').removeClass('rightin')
            $("#content_" + current).show().addClass(app.tabs[previous].index <= app.tabs[current].index ? 'leftin' : 'rightin')
            self.current = current
            
            self.render()
        }
    })
    
    
    
}


app.boot = function(){
    document.ontouchmove = function(e){
        e.preventDefault();
    }
    $('#main').live('pagebeforecreate', function(){
        app.boot_platform()
    })
}

app.boot_platform = function(){
    if ('android' == app.platform) {
        $('#header').hide()
        $('#footer').attr({
            'data-role': 'header'
        })
        $('#content').css({
            'margin-top': 59
        })
    }
}

app.init_platform = function(){
    if ('android' == app.platform) {
        $('li span.ui-icon').css({
            'margin-top': -4
        })
    }
}

app.start = function(){
    $("#tab_" + app.initialtab).tap()
}

app.erroralert = function(error){
    alert(error)
}


app.init = function(){
    console.log('start init')
    
    app.init_platform()
    
    bb.init()
    
    app.model.state = new bb.model.State()
    app.model.items = new bb.model.Items()
    app.model.nearbyitems = new bb.model.NearbyItems()
    app.view.navigation = new bb.view.Navigation(app.initialtab)
    app.view.navigation.render()
    
    app.view.content = new bb.view.Content(app.initialtab)
    app.view.content.render()
    
    app.view.list = new bb.view.List(app.model.items)
    app.view.toplist = new bb.view.TopList(app.model.items)
    app.view.nearbylist = new bb.view.NearbyList(app.model.nearbyitems)
    
    
    app.model.items.fetch({
        success: function(){
            app.view.list.render()
            app.view.toplist.render()
        },
        failure: function(){
            debugger;
        }
    })
    
    
    
    app.start()
    
    console.log('end init')
}


app.boot()
$(app.init)


wpid = navigator.geolocation.watchPosition(geo_success, geo_error, {
	enableHighAccuracy : true,
	maximumAge : 30000,
	timeout : 27000
});

function geo_success(position) {
	app.latitude = position.coords.latitude
	app.longitude = position.coords.longitude
	app.mylocation = [app.latitude, app.longitude]
	
	app.model.nearbyitems.fetch({
        success: function(){
            app.view.nearbylist.render()
        },
        failure: function(){
            debugger;
        }
    })
};
function geo_error(position) {
	debugger
};
