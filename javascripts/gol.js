// Simple sleep function for animation
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// Set up info messages
var InfoMessage = Backbone.Model.extend({
    messageText: "hello world"
});
var InfoMessages = Backbone.Collection.extend({
  model: InfoMessage
});

// Set up board model
var BoardModel = Backbone.Model.extend({
    urlRoot: 'http://localhost:8080/new/5'
});

// Set up view
var AppView = Backbone.View.extend({
  el: '#container',

  initialize: function(){
    this.infoMessages = new InfoMessages();
    this.listenTo(this.model, 'change', this.render);
    this.model.fetch({success: this.serverSuccess, error: this.serverError});
  },

  serverSuccess: function(model, response) {
    // Do nothing for now
  },

  serverError: function(model, response) {
    appView.logMessage("Contacting Game of Life API server failed (" + response.statusText + "), URL: <i>" + appView.model.urlRoot + "</i>");
  },

  logMessage: function(msg) {
    this.infoMessages.add(new InfoMessage({messageText: msg}));
    this.render();
  },

  render: function(){
    var states = this.model.attributes.States;
    var html = "<table>";
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
      this.model.save(null, {success: this.serverSuccess, error: this.serverError});
    }
    html += "</table>";
    for (var i = 0; i < this.infoMessages.models.length; i++) {
      html += this.infoMessages.models[i].attributes.messageText + "<br/>";
    }
    this.$el.html(html);
    sleep(100);
  }
});

// Start
var boardModel = new BoardModel();
var appView = new AppView({model: boardModel});