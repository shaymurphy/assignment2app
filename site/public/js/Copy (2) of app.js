



var i = 0

var app = {
    model: {},
    view: {},
    tabs: {
        recent: {
            index: i++,
            icon: '73-radar'
        },
        capture: {
            index: i++,
            icon: '86-camera'
        },
        status: {
            index: i++,
            icon: '81-dashboard'
        },
        storage: {
            index: i++,
            icon: '33-cabinet'
        },
        phonegap: {
            index: i++,
            icon: '32-iphone'
        }
    },
    platform: /Android/.test(navigator.userAgent) ? 'android' : 'ios',
    initialtab: 'recent'
}

console.log(app)

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{-(.+?)\}\}/g,
    evaluate: /\{\{=(.+?)\}\}/g
};


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
    
    bb.model.Item = Backbone.Model.extend(_.extend({
        defaults: {
            done: false,
            text: '',
            mylocation: ''
        },
        
        initialize: function(){
            var self = this
            _.bindAll(self)
        },
        marktoggle: function(){
            var self = this
            self.save({
                done: !self.get("done")
            });
        },
        removeitem: function(){
            var self = this
            self.destroy()
        }
    }))
    
    bb.model.Items = Backbone.Collection.extend(_.extend({
        model: bb.model.Item,
        localStorage: new Store("items"),
        //	url : '/api/rest/todo',
        
        initialize: function(){
            var self = this
            _.bindAll(self)
            self.count = 0
            
            self.on('reset', function(){
                self.count = self.length
            })
        },
        additem: function(itemText){
            var self = this
            var item = new bb.model.Item({
                text: itemText,
                done: false,
                mylocation: app.userlocation
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
    
    bb.view.List = Backbone.View.extend(_.extend({
        initialize: function(items){
            var self = this
            _.bindAll(self)
            
            self.setElement('#list')
            
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
            $('span.stars').stars();
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
    
    bb.view.Item = Backbone.View.extend(_.extend({
    
        template: {
            item: _.template($('#list').html())
        },
        
        events: {
            'tap .check': function(){
                var self = this;
                self.model.marktoggle();
                self.markitem()
            },
            'tap .delete': function(){
                var self = this
                self.model.removeitem();
            },
            'swipe #item_tm': function(){
                var self = this
                
                self.$el.find('.delete').css({
                    'display': 'block'
                })
                
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
        markitem: function(){
            var self = this
            done = self.model.get("done")
            self.$el.find('.check').html(done ? '&#10003;' : '&nbsp;')
            self.$el.find('.text').css({
                'text-decoration': done ? 'line-through' : 'none'
            })
        },
        render: function(){
            var self = this
            
            var html = self.template.item(self.model.toJSON())
            self.$el.append(html)
            self.markitem()
            return self
        },
        remove: function(){
            var self = this
            $(self.el).remove()
        }
    }))
    
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
            
            function handletab(tabname){
                return function(){
                    app.model.state.set({
                        current: tabname
                    })
                    if (tabname == 'capture') {
                        app.model.items.additem('item1')
                    }
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
    
    
    bb.view.Recent = Backbone.View.extend({
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.elem = {
                accel_watch_btn: $('#sense_accel_watch'),
                accel_stop_btn: $('#sense_accel_stop'),
                accel_x: $('#sense_accel_x'),
                accel_y: $('#sense_accel_y'),
                accel_z: $('#sense_accel_z'),
                accel_x_val: $('#sense_accel_x_val'),
                accel_y_val: $('#sense_accel_y_val'),
                accel_z_val: $('#sense_accel_z_val'),
                
                button: $('#sense_button')
            }
            
            self.elem.accel_watch_btn.tap(function(){
                self.watchID = navigator.accelerometer.watchAcceleration(self.update_accel, app.erroralert, {
                    frequency: 10
                })
            })
            
            self.elem.accel_stop_btn.tap(function(){
                self.watchID && navigator.accelerometer.clearWatch(self.watchID)
            })
            
            function call_update_button(name){
                return function(){
                    self.update_button(name)
                }
            }
            
            document.addEventListener("backbutton", call_update_button('back'))
            document.addEventListener("menubutton", call_update_button('menu'))
            document.addEventListener("searchbutton", call_update_button('search'))
        },
        
        render: function(){
        },
        
        update_accel: function(data){
            var self = this
            self.elem.accel_x.css({
                marginLeft: data.x < 0 ? 70 + (70 * data.x) : 70,
                width: Math.abs(70 * data.x)
            })
            self.elem.accel_y.css({
                marginLeft: data.y < 0 ? 70 + (70 * data.y) : 70,
                width: Math.abs(70 * data.y)
            })
            self.elem.accel_z.css({
                marginLeft: data.z < 0 ? 70 + (70 * data.z) : 70,
                width: Math.abs(70 * data.z)
            })
            self.elem.accel_x_val.text(data.x)
            self.elem.accel_y_val.text(data.y)
            self.elem.accel_z_val.text(data.z)
        },
        
        update_button: function(name){
            var self = this
            self.elem.button.text(name)
        }
    })
    
    
    bb.view.Capture = Backbone.View.extend({
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.elem = {
                image_btn: $('#capture_image'),
                video_btn: $('#capture_video'),
                audio_btn: $('#capture_audio'),
                image_play: $('#capture_image_play'),
                video_play: $('#capture_video_play'),
                audio_play: $('#capture_audio_play')
            }
            
            self.elem.image_btn.tap(function(){
                navigator.device.capture.captureImage(function(mediafiles){
                    self.elem.image_play.attr({
                        src: 'file://' + mediafiles[0].fullPath
                    })
                    app.model.state.trigger('scroll-refresh')
                }, app.erroralert)
            })
            
            self.elem.video_btn.tap(function(){
                navigator.device.capture.captureVideo(function(mediafiles){
                    self.elem.video_play.show().attr({
                        href: 'file://' + mediafiles[0].fullPath
                    })
                    app.model.state.trigger('scroll-refresh')
                }, app.erroralert)
            })
            
            self.elem.audio_btn.tap(function(){
                navigator.device.capture.captureAudio(function(mediafiles){
                    self.elem.audio_play.show().attr({
                        href: 'file://' + mediafiles[0].fullPath
                    })
                    app.model.state.trigger('scroll-refresh')
                }, app.erroralert)
            })
            
        },
        render: function(){
        }
    })
    
    bb.view.Status = Backbone.View.extend({
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.elem = {}
        },
        render: function(){
        }
    })
    
    bb.view.Storage = Backbone.View.extend({
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.elem = {}
        },
        render: function(){
        }
    })
    
    bb.view.PhoneGap = Backbone.View.extend({
        initialize: function(){
            var self = this
            _.bindAll(self)
            
            self.elem = {
                name: $('#phonegap_name'),
                phonegap: $('#phonegap_phonegap'),
                platform: $('#phonegap_platform'),
                uuid: $('#phonegap_uuid'),
                version: $('#phonegap_version')
            }
        },
        
        render: function(){
            var self = this
            
            self.elem.name.txt(device.name)
            self.elem.phonegap.txt(device.phonegap)
            self.elem.platform.txt(device.platform)
            self.elem.uuid.txt(device.uuid)
            self.elem.version.txt(device.version)
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
    app.view.navigation = new bb.view.Navigation(app.initialtab)
    app.view.navigation.render()
    
    app.view.content = new bb.view.Content(app.initialtab)
    app.view.content.render()
    
    app.view.recent = new bb.view.Recent()
    app.view.capture = new bb.view.Capture()
    app.view.status = new bb.view.Status()
    app.view.storage = new bb.view.Storage()
    app.view.phonegap = new bb.view.PhoneGap()
    
    app.view.list = new bb.view.List(app.model.items)
    app.view.list.render()
    
    app.model.items.fetch({
        success: function(){
            app.view.list.render()
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


/* possible code to add */
function fetchGeo(){
    navigator.geolocation.getCurrentPosition(function(pos){
        // Succesfully got location
        var lat = pos.coords.latitude, lng = pos.coords.longitude;
        // Do something with the position!
        fetchLocations(lat, lng);
    }, function(error){
        // Failed to get location
        var msg = "";
        switch (error.code) {
            case error.PERMISSION_DENIED:
                msg = "Ooops. You have disallowed our app!";
                break;
            case error.POSITION_UNAVAILABLE:
                msg = "Sorry, we couldn't get your location.";
                break;
            case error.TIMEOUT:
                msg = "Sorry, fetch timeout expired.";
                break;
        }
    }, {
        // Options for geolocation
        maximumAge: 10000,
        timeout: 10000,
        enableHighAccuracy: true
    });
}

/* end of possible code to add */


