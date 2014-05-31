steal(function(){

	return function(obj, copy){
		for(var p in copy) {
			obj[p] = copy[p];
		}
	};

});
