'use strict';
var request = require('request');
// Permet de faire des appels vers une API
var ApiManager = (function() {

	function ApiManager() {
	}

	ApiManager.GET = 'GET';
	ApiManager.POST = 'POST';
	ApiManager.PUT = 'PUT';

	// Affiche un message précédé du nom de la classe
    ApiManager.log = function(message) {
        console.log("[ApiManager] " + message);
    };

	// Génère une url avec paramètres lors d'un get
	ApiManager.prototype.createUrl = function(url, data) {
		if (data !== undefined) {
			var properties = Object.getOwnPropertyNames(data);
			var params = "";
			var special_char = "?";
			for (var i = properties.length - 1; i >= 0; i--) {
				params += special_char + properties[i] + "=" + data[properties[i]];
				special_char = "&";
			}
			return url + params;
		}
	};

	// Génère le formulaire d'une requête POST/PUT
	ApiManager.createForm = function(data) {
		if (data !== undefined) {
			var properties = Object.getOwnPropertyNames(data);
			var form = {};
			for (var i = properties.length - 1; i >= 0; i--) {
				form[properties[i]] = data[properties[i]];
			}
			return form;
		}
	};

	// Traite le résultat de la requête (POST|GET|PUT)
	ApiManager.resultOfRequest = function(option) {
		var result = null;
		if (!option.error) {
			if (option.httpResponse.statusCode == 200) {
				result = JSON.parse(option.body);
				ApiManager.log(option.method + " on " + option.url + " success. " /*+ option.body*/);
			} else {
				ApiManager.log("Warning ! " + option.method + " on " + option.url + " has failed.");
				ApiManager.log("Info: Error " + option.httpResponse.statusCode);
			}
		} else {
			ApiManager.log("Warning ! Apache server is not responding");
		}
		return option.callback(null, result);
	};

	// Effectu un GET
	ApiManager.prototype.get = function(url, callback) {
		// on execute la requête
		request(
			url,
			function (error, httpResponse, body) {
				return ApiManager.resultOfRequest(
					{
						method: ApiManager.GET,
						url: url,
						error: error,
						httpResponse: httpResponse,
						body: body,
						callback: callback
					}
				);
			}
		);		
		ApiManager.log(ApiManager.GET + " on " + url + " start.");
	};

	// Effectu un POST
	ApiManager.prototype.post = function(url, data, callback) {
		// on construit le formulaire
		var form = ApiManager.createForm(data);
		// on execute la requête
		request.post(
			{
				url: url,
				form: form,
			},
			function(error, httpResponse, body){					
				return ApiManager.resultOfRequest(
					{
						method: ApiManager.POST,
						url: url,
						error: error,
						httpResponse: httpResponse,
						body: body,
						callback: callback
					}
				);
			}
		);
		ApiManager.log(ApiManager.POST + " on " + url + " start.");
	};

	// Effectu un PUT
	ApiManager.prototype.put = function(url, data, callback) {
		var bodyString = JSON.stringify(data);
		var headers = {
			'Content-Type': 'application/json',
			'Content-Length': bodyString.length
		};
		// on execute la requête
		request(
			{ 
				method: ApiManager.PUT,
				uri: url,
				headers: headers
			},
			function (error, httpResponse, body) {				
				return ApiManager.resultOfRequest(
					{
						method: ApiManager.PUT,
						url: url,
						error: error,
						httpResponse: httpResponse,
						body: body,
						callback: callback
					}
				);
			}
		).write(bodyString);
		ApiManager.log(ApiManager.PUT + " on " + url + " start.");
	};

	return ApiManager;
})();

module.exports = new ApiManager();