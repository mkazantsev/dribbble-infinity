var DRIBBLE_URL = 'http://api.dribbble.com/shots',
	PER_PAGE = 9;

var Shot = Backbone.Model.extend({
	'defaults': {
		'likes_count': 0,
		'comments_count': 0
	}
});

var Shots = Backbone.Collection.extend({
	'model': Shot,
	'fetch': function(options) {
		var options = options || {};
		options.add = true;
		options.dataType = 'jsonp';
		options.data = {
			'per_page': PER_PAGE,
			'page': this.page
		};

		var that = this;
		options.success = function() {
			that.page++;
			that.trigger('fetch:end', this);
		};

		this.trigger('fetch:start');
		Backbone.Collection.prototype.fetch.call(this, options);
	},
	'parse': function(response) {
		return response.shots;
	},
	'initialize': function() {
		this.page = 1;
	}
});

var Popular = Shots.extend({
	'url': DRIBBLE_URL + '/popular'
});

var Debut = Shots.extend({
	'url': DRIBBLE_URL + '/debuts'
});

var Everyone = Shots.extend({
	'url': DRIBBLE_URL + '/everyone'
});

var ShotView = Backbone.View.extend({
	'tagName': 'article',
	'className': 'image-wrapper',
	'template': $('#shotTemplate').html(),
	'render': function() {
		var tmpl = _.template(this.template);
		this.$el.html(tmpl(this.model.toJSON()));
		return this;
	}
});

var DribbbleView = Backbone.View.extend({
	'el': $('#shots'),
	'initialize': function() {
		this.collections = {
			'popular': new Popular(),
			'debut': new Debut(),
			'everyone': new Everyone()
		};
		_.each(['popular', 'debut', 'everyone'], function (title) {
			this.collections[title].on('fetch:end', function() {
				$('#loader-image').hide();
				this.renderNew();
			}, this);
			this.collections[title].on('fetch:start', function() {
				$('#loader-image').show();
			}, this);
			this.collections[title].on('change', function() {
				if (this.collection.models.length == 0) {
					this.collection.fetch();
				}
				this.render();
			}, this);
		}, this);
		this.collection = this.collections['popular'];
		this.collection.fetch();
	},
	'render': function() {
		this.$el.empty();
		_.each(this.collection.models, function (shot) {
			this.renderShot(shot);
		}, this);
		this.$el.append(this.createLoadMore());
	},
	'renderNew': function() {
		this.$el.find('#load').remove();
		_.each(_.last(this.collection.models, PER_PAGE), function (shot) {
			this.renderShot(shot);
		}, this);
		this.$el.append(this.createLoadMore());
	},
	'renderShot': function(shot) {
		var shotView = new ShotView({
			'model': shot
		});
		this.$el.append(shotView.render().el);
	},
	'createLoadMore': function() {
		return $('<footer>', {
			'html': '<input type="button" id="load" value="Load More">'
		});
	},
	'events': {
		'click #load': 'loadMore'
	},
	'loadMore': function() {
		this.collection.fetch();
	}
});

var dribbble = new DribbbleView();

var MenuView = Backbone.View.extend({
	'el': $('nav'),
	'initialize': function(options) {
		this.content = options.content;
	},
	'events': {
		'click li': 'load'
	},
	'load': function(event) {
		this.$el.find('li').removeClass('active');
		$('#' + event.currentTarget.id).addClass('active');
		this.content.collection = this.content.collections[event.currentTarget.id];
		this.content.collection.trigger('change');
	}
});

var menu = new MenuView({
	'content': dribbble
});