/******************** MODELS ********************/

// Set up server info model
var ServerModel = Backbone.Model.extend({
    initialize: function(){
      this.baseUrl = "http://localhost:8080";
      this.getInfo();
    },

    getInfo: function() {
      this.fetch({success: this.success, error: this.error});
    },

    resetTo: function(newBaseUrl) {
      this.clear();
      boardModel.reset();
      this.baseUrl = newBaseUrl;
      this.set({baseUrl: newBaseUrl});
      this.getInfo();
    },

    urlRoot: function(){ return this.baseUrl + '/info/'},

    success: function(model, response) {
      logView.logMessage("Getting server info succeeded at " + serverModel.urlRoot());
      logView.logMessage("Starting animation.");
      boardModel.set({"animated":true});
    },

    error: function(model, response) {
      logView.logMessage("Getting server info failed at " + serverModel.urlRoot(), "warn");
      boardModel.set({"animated":false});
    }
});

// Set up board model
var BoardModel = Backbone.Model.extend({
    defaults: {
      States: [],
    },
    animated: false,
    size: 10,
    possibleSizes: [4, 10, 20],
    urlRoot: function(){ return serverModel.baseUrl + '/step/'},
    seedStates: function() {
      newStates = [];
      for (var row = 0; row < this.size; row++) {
        newStates[row] = [];
        for (var col = 0; col < this.size; col++) {
          var x = Math.floor((Math.random() * 2) + 1);
          newStates[row][col] = x == 1;
        }
      }
      this.set({States: newStates});
    },
    reset: function() {
      this.set({animated: false});
      this.set(this.defaults);
    },
    error: function(model, response, options) {
      logView.logMessage("Getting next step failed at " + boardModel.urlRoot() + ", stopping animation", "warn");
      boardModel.set({"animated":false});
    }
});

// Set up log messages model
var LogMessage = Backbone.Model.extend({
    messageText: ""
});
var LogMessages = Backbone.Collection.extend({
  model: LogMessage
});

/******************** VIEWS ********************/

// Set up server info view
var ServerView = Backbone.View.extend({
  el: '#server-info',

  initialize: function(){
    this.render();
    this.listenTo(this.model, 'change', this.render);
  },

  events : function () {
    var evts = {};
    var view = this;
    var model = view.model;

    evts["click #btn-connect"] = function() {
      model.resetTo($("#serveraddr").val());
    };

    return evts;
  },

  render: function(){
    var serverInfoTemplate = _.template($("#template-server-info").html());
    this.$el.html(serverInfoTemplate({address: this.model.baseUrl, author: this.model.attributes.Author, language: this.model.attributes.Language, sourceCodeUrl: this.model.attributes.SourceCodeURL, live: this.model.attributes.LiveColor, dead: this.model.attributes.DeadColor}));
  }
});

// Set up log messages view
var LogView = Backbone.View.extend({
  el: '#messages',

  initialize: function(){
    this.infoMessages = new LogMessages();
  },

  logMessage: function(msg, severity) {
    var dt = new Date();
    var time = dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "\t";

    var severityText = ""
    if (severity == "warn") {
      severityText = "<span class='label label-danger'>ERROR</span> "
    } else {
      severityText = "<span class='label label-success'>INFO</span> "
    }

    this.infoMessages.add(new LogMessage({messageText: time + severityText + msg}));
    this.render();
  },

  render: function(){
    var html = "";
    for (var i = this.infoMessages.models.length - 1; i >= 0; i--) {
      html += "<tr><td>" + this.infoMessages.models[i].attributes.messageText  + "</td></tr>";
    }
    this.$el.html(html);
  }
});

var BoardSizeView = Backbone.View.extend({
  el: '#boardbuttons',

  initialize: function() {
    this.render();
  },

  events : function () {
    var evts = {};
    var view = this;
    var model = view.model;

    model.possibleSizes.forEach( function(size) {
      evts["click #btn-" + size] = (function(size) {
        return function (event) {
          model.set({"size": size});
        };
      })(size);

    });

    evts["click #btn-stop"] = function() {view.model.set({"animated": false})};
    evts["click #btn-start"] = function() {view.model.set({"animated": true})};

    return evts;
  },

  render: function() {
    var buttonsTemplate = _.template($("#template-buttons").html());
    this.$el.html(buttonsTemplate({currentSize: this.model.size, possibleSizes: this.model.possibleSizes, animated: this.model.animated}));
  }

});

// Set up board view
var BoardView = Backbone.View.extend({
  el: '#gameoflife',

  initialize: function(){
    _.bindAll(this);
    this.listenTo(this.model, 'change', this.modelChanged);
    setInterval(this.refresh, 80);
  },

  refresh: function(){
    var snapshotModel = this.model;
    if (snapshotModel.animated) {
      if (snapshotModel.States == undefined || snapshotModel.States.length != snapshotModel.size) {
        // Size has changed, get a new seed
        this.model.seedStates();
      } else {
        if (snapshotModel.hasChanged()) {
          this.model.save(null, {error: this.model.error});
        }
      }
    }
  },

  modelChanged: function() {
    if (this.model.changed.size != undefined) {
      this.model.size = this.model.changed.size;
      boardSizeView.render();
    } else if (this.model.changed.animated != undefined) {
      this.model.animated = this.model.changed.animated;
      boardSizeView.render();
    } else if (this.model.changed.States != undefined) {
      if (this.model.changed.States.length == 0) {
        // Reset
        this.model.States = this.model.changed.States;
      } else {
        if (this.model.changed.States.length != this.model.size) {
          console.log("size wrong, this is an old update - discard.");
        } else if (this.model.animated == false) {
          console.log("received an update but animation is stopped - discard.");
        } else {
          this.model.States = this.model.changed.States;
        }
      }
    }
    this.render();
  },

  render: function(){
    var bgColor = function(cellState) {
      if (cellState) {
        return serverModel.attributes.LiveColor;
      } else {
        return serverModel.attributes.DeadColor;
      }
    };
    var boardTemplate = _.template($("#template-board").html());
    this.$el.html(boardTemplate({states: this.model.States, bgColor: bgColor}));
  }
});

// Start
var boardModel = new BoardModel();
var serverModel = new ServerModel();

var serverView = new ServerView({model: serverModel});
var boardView = new BoardView({model: boardModel});
var logView = new LogView();
var boardSizeView = new BoardSizeView({model: boardModel});

