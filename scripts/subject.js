var SUBJECT = {
    messageFilter : [], //null stands for no filter
    observers : [],

    //设置message的取值范围
    setMessageFilter : function(collection) {
        this.messageFilter = collection;
    },

    notifyObserver : function(message, data) {
        if (this.messageFilter && this.messageFilter.indexOf(message) < 0) {
            console.warn("WARN: the message posted is invalid!",message);
            return;
        }

        console.log("Subject: " + message + ' post!' );

        for (var i = 0; i < this.observers.length; i++) {
            if (this.observers[i].obsUpdate)
                this.observers[i].obsUpdate(message, data);
        }
    },

    registerObserver : function(observer) {
        if (typeof observer.obsUpdate !== 'function') {
            console.warn("WARN: the observer does not have obsUpdate function!");
            console.warn(observer);
            return;
        }
        this.observers.push(observer);
    },

    removeObserver : function(observer) {
        var index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        } else {
            console.warn("WARN: the observer is not register!");
            console.warn(observer);
        }
    }
}


    


