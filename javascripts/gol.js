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
    messageText: ""
});
var InfoMessages = Backbone.Collection.extend({
  model: InfoMessage
});

// Set up board model
var BoardModel = Backbone.Model.extend({
    urlRoot: 'http://localhost:8080/new/10'
});

// Set up view
var AppView = Backbone.View.extend({
  el: '#container',

  initialize: function(){
    this.infoMessages = new InfoMessages();
    this.numMessages = 0;
    this.listenTo(this.model, 'change', this.renderAndSave);
    this.model.fetch({success: this.serverSuccess, error: this.serverError});
  },

  serverSuccess: function(model, response) {
    appView.numMessages += 1;
    appView.logMessage(appView.numMessages + " Contacting Game of Life API server succeeded");
  },

  serverError: function(model, response) {
    appView.logMessage("Contacting Game of Life API server failed (" + response.statusText + "), URL: <i>" + appView.model.urlRoot + "</i>");
  },

  logMessage: function(msg) {
    this.infoMessages.add(new InfoMessage({messageText: msg}));
    this.justRender();
  },

  renderAndSave: function() {
    this.justRender();
    this.model.save(null, {success: this.serverSuccess, error: this.serverError});
  },

  justRender: function(){
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
    }
    /*html += "</table></div><div class='col-md-4 panel panel-primary'><div class='panel-heading'><h3 class='panel-title'>Server messages</h3></div><div class='panel-body'>";
    for (var i = this.infoMessages.models.length - 1; i >= 0; i--) {
      html += this.infoMessages.models[i].attributes.messageText + "<br/>";
    }
    html += "</div></div>";
    */
    this.$el.html(html);
    sleep(100);
  }
});

// Start
var boardModel = new BoardModel();
var appView = new AppView({model: boardModel});