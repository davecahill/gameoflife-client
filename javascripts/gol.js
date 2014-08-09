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

// Set up board model
var BoardModel = Backbone.Model.extend({
    size: 10,
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

  events : function () {
    var evts = {};
    var view = this;

    [4, 10, 20].forEach( function(size) {
      evts[ "click #btn-" + size ] = (function(size) {
        return function (event) {
          view.model.set({"size": size});
        };
      })(size);

    });

    return evts;
  },

  setSize: function(size) {
    boardModel.size = size;
  }

});

// Set up board view
var BoardView = Backbone.View.extend({
  el: '#gameoflife',

  initialize: function(){
    this.listenTo(this.model, 'change', this.renderAndSave);
    // Kick off the initial request to get the "seed"
    this.model.fetch();
  },

  renderAndSave: function() {
    if (this.model.changed.size != undefined) {
      // size changed - reflect that and fetch a new "seed"
      this.model.size = this.model.changed.size;
      this.model.fetch();
    } else {
      if (this.model.changed.States != undefined && this.model.changed.States.length == this.model.size) {
        this.render();
        sleep(100);
        this.model.save();  
      } else {
        console.log("size wrong, this is an old update - discard.");
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
var boardView = new BoardView({model: boardModel});
var logView = new LogView();
var boardSizeView = new BoardSizeView({model: boardModel});

