// Simple sleep function for animation
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// Set up log messages model
var LogMessage = Backbone.Model.extend({
    messageText: ""
});
var LogMessages = Backbone.Collection.extend({
  model: LogMessage
});

// Set up server info model
var ServerModel = Backbone.Model.extend({
    initialize: function(){
      this.fetch({success: this.success, error: this.error});
    },
    urlRoot: function(){ return 'http://localhost:8080/info/'},
    success: function(model, response) {
      logView.logMessage("Getting Game of Life server info succeeded, URL: <i>" + serverModel.urlRoot() + "</i>");
      logView.logMessage("Server name: <i>" + response.ServerName + "</i>");
      logView.logMessage("Server live color: <i>" + response.LiveColor + "</i>");
      logView.logMessage("Server dead color: <i>" + response.DeadColor + "</i>");
    },
    error: function(model, response) {
      logView.logMessage("Getting Game of Life server info failed (" + response.statusText + "), URL: <i>" + serverModel.urlRoot() + "</i>");
    }
});

// Set up board model
var BoardModel = Backbone.Model.extend({
    size: 10,
    possibleSizes: [4, 10, 20],
    animated: true,
    urlRoot: function(){ return 'http://localhost:8080/new/' + this.size},
    success: function(model, response) {
      logView.logMessage("Contacting Game of Life API server succeeded, URL: <i>" + this.urlRoot + "</i>");
    },
    error: function(model, response) {
      logView.logMessage("Contacting Game of Life API server failed (" + response.statusText + "), URL: <i>" + this.urlRoot + "</i>");
    }
});

// Set up log messages view
var LogView = Backbone.View.extend({
  el: '#messages',

  initialize: function(){
    this.infoMessages = new LogMessages();
  },

  logMessage: function(msg) {
    this.infoMessages.add(new LogMessage({messageText: msg}));
    this.render();
  },

  render: function(){
    var html = "";
    for (var i = this.infoMessages.models.length - 1; i >= 0; i--) {
      html += "<tr><td>[" + (i + 1) + "] " + this.infoMessages.models[i].attributes.messageText  + "</td></tr>";
    }
    this.$el.html(html);
  }
});

var BoardSizeView = Backbone.View.extend({
  el: '#boardbuttons',

  initialize: function(){
    this.listenTo(this.model, 'change', this.modelChanged);
    this.render();
  },

  modelChanged: function() {
    if (this.model.changed.animated != undefined) {
      this.render();
    }
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
    html = "<b>Board size:</b><div class='btn-group' data-toggle='buttons'>"
    this.model.possibleSizes.forEach( function(size) {
      html += "<label class='btn btn-default' id='btn-" + size + "'><input type='radio' name='options'> " + size + "x" + size + "</label>";
    });

    stopHidden = "";
    startHidden = "";
    if (this.model.animated) {
      startHidden = "hidden";
    } else {
      stopHidden = "hidden";
    }
    html +="</div><div><b>Animation actions:</b><div class='btn-group' id='animationbuttons'><button type='button' class='btn btn-danger " + stopHidden + "' id='btn-stop'>Stop animation</button><button type='button' class='btn btn-success " + startHidden + "' id='btn-start'>Start animation</button></div></div>";
    this.$el.html(html);
  }

});

// Set up board view
var BoardView = Backbone.View.extend({
  el: '#gameoflife',

  initialize: function(){
    this.listenTo(this.model, 'change', this.modelChanged);
    // Kick off the initial request to get the "seed"
    this.model.fetch();
  },

  modelChanged: function() {
    if (this.model.changed.size != undefined) {
      // size changed - reflect that and fetch a new "seed"
      this.model.size = this.model.changed.size;
      this.model.fetch();
    } else if (this.model.changed.animated != undefined) {
        this.model.animated = this.model.changed.animated;
        if (this.model.animated) {
          this.model.save();
        }
    } else if (this.model.changed.States != undefined) {
      if (this.model.changed.States.length != this.model.size) {
        console.log("size wrong, this is an old update - discard.");
      } else if (this.model.animated == false) {
        console.log("received an update but animation is stopped - discard.");
      } else {
        this.render();
        sleep(100);
        this.model.save();  
      }
    }
  },

  render: function(){
    var states = this.model.attributes.States;
    var html = "";
    if (states) {
      for (var row = 0; row < states.length; row++) {
        html += "<tr>";
        for (var cell = 0; cell < states[row].length; cell++) {
          html += "<td class='";
          if (states[row][cell]) {
            html += "alive";
          } else {
            html += "dead";
          }
          html += "''></td>";
        }
        html += "</tr>";
      }
    }
    this.$el.html(html);
  }
});

// Start
var boardModel = new BoardModel();
var serverModel = new ServerModel();
var boardView = new BoardView({model: boardModel});
var logView = new LogView();
var boardSizeView = new BoardSizeView({model: boardModel});

