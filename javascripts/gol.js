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
    urlRoot: 'http://localhost:8080/new/10'
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
      html += "<tr><td>" + (i + 1) + "</td><td>" + this.infoMessages.models[i].attributes.messageText  + "</td></tr>";
    }
    this.$el.html(html);
  }
});


// Set up board view
var BoardView = Backbone.View.extend({
  el: '#gameoflife',

  initialize: function(){
    this.listenTo(this.model, 'change', this.renderAndSave);
    // Kick off the initial request to get the "seed"
    this.model.fetch({success: this.serverSuccess, error: this.serverError});
  },

  serverSuccess: function(model, response) {
    logView.logMessage("Contacting Game of Life API server succeeded");
  },

  serverError: function(model, response) {
    logView.logMessage("Contacting Game of Life API server failed (" + response.statusText + "), URL: <i>" + boardView.model.urlRoot + "</i>");
  },

  renderAndSave: function() {
    this.render();
    sleep(100);
    this.model.save(null, {success: this.serverSuccess, error: this.serverError});
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

