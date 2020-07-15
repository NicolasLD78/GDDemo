// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

var namespace = {};

const vscode = require('vscode');
const fs = require('fs');

let liste_fichiers;

let liste_fichiers_json = [];

let map_ids = {};
let map_extends = {};

let liste_ids = [];
let liste_extends = [];
let liste_current_chemins = [];

const regexpObj = new RegExp("\""+ "@+[a-zA-Z0-9_-]*\\" + "/([a-zA-Z0-9_-]*)"+"\"",'i');

const origin_path = "\\json-reading\\json";

const path = require('path');

// Liste les chemins des sous-dossiers


function flatten(lists) {
	return lists.reduce((a, b) => a.concat(b), []);
  }
  
  function getDirectories(srcpath) {
	return fs.readdirSync(srcpath)
	  .map(file => path.join(srcpath, file))
	  .filter(path => fs.statSync(path).isDirectory());
  }
  
  function getDirectoriesRecursive(srcpath) {
	return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
  }




const openFile = function(uri)
{
	let doc = vscode.workspace.openTextDocument(uri);
	vscode.window.showTextDocument(doc, { preview: false });
}


const getAllFiles = function(dirPath, arrayOfFiles) {
	files = fs.readdirSync(dirPath)
  
	arrayOfFiles = arrayOfFiles || []
  
	files.forEach(function(file)
	{
	  if (fs.statSync(dirPath + "/" + file).isDirectory())
	  {
		  arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
	  } 
	  else
	  {
		  arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
	  }
	})
  
	return arrayOfFiles
  }

const changeSlash = function(STR)
{
	var ind = [];
  	for(let i=0;i<STR.length;i++)
 	{
		if(STR[i]=='/')
		{
			ind.push(i);
		}
  	}

	for(let i=0;i<ind.length;i++)
  	{
		STR = STR.replace('/','\\');
  	}

	return STR;
}

// MET DANS filelist TOUS LES FICHIERS D'UN DOSSIER (ici "json")

const walkSync = function(dir, filelist) {
	var path = path || require('path');
	var fs = fs || require('fs'),
		files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function(file) {
		if (fs.statSync(path.join(dir, file)).isDirectory()) {
			filelist = walkSync(path.join(dir, file), filelist);
		}
		else {
			filelist.push(path.join(dir, file));
			//console.log(file);
		}
	});
	return filelist;
};

const remplissage_init = function(other_folderPath)
{
	liste_fichiers = walkSync(other_folderPath,liste_fichiers);

	for(let i = 0; i < liste_fichiers.length; i++)
	{
		if(liste_fichiers[i].includes('.json'))
		{
			liste_fichiers_json.push(liste_fichiers[i]);
		}
	}
}


function getIndicesOf(str,searchStr) 
{
	var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
	let startIndex = 0;
	let index;
	let indices = [];

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
	}
    return indices;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context)
{
	console.log('Congratulations, your extension "json-reading" is now active!');

	const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;

	const other_folderPath = folderPath + origin_path;

	remplissage_init(other_folderPath);

	console.log("INITIALISATION");

	let disposable = vscode.commands.registerCommand('json-reading.read_json', function ()
	{
		liste_ids = [];
		liste_extends = [];
		liste_current_chemins = [];

		// ON RECUPERE LES CHEMINS DES DOSSIERS ET DES FICHIERS

		const all_dir =  getDirectoriesRecursive(other_folderPath);

		console.log("other_folderPath");
		console.log(other_folderPath);

		
		console.log(all_dir[0]);
		console.log(all_dir[1]);
		console.log(all_dir[2]);
		
		/*

		// TOUS LES DOSSIERS

		const files = fs.readdirSync(all_dir[2]);

		//const files = fs.readdirSync(other_folderPath);

		//const files = fs.readdirSync(all_dir[0]);

		for(let i=0;i<files.length;i++)
		{
			files[i] = all_dir[2]+'\\'+files[i];
			//files[i] = other_folderPath+'\\'+files[i];
		}

		console.log("files");
		console.log(files);

		*/

		//Parcours des fichiers à l'intérieur du dossier "json"


		console.log("liste_fichiers");
		console.log(liste_fichiers);

		console.log("liste_fichiers_json");
		console.log(liste_fichiers_json);
	

		// Selection de la ligne avec le curseur


		var editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			return; // No open text editor
		}

		var current_Document_Name = editor.document.fileName;
		console.log("current_Document_Name");
		console.log(current_Document_Name);

		var Data = fs.readFileSync(current_Document_Name,'utf8');

		/*
		console.log("LIST");
		let LIST = getIndicesOf(Data,"configurationProfiles");
		console.log(LIST);
		*/

		var str = Data;

		// JSON PARSER

		var parsed = JSON.parse(str);

		//on garde la partie "configuationProfiles" du JSON

		for(let obj in parsed.configurationProfiles)
		{
			if(obj == "@extends")
			{
				//console.log("chemins en haut du fichier");
				let path = parsed.configurationProfiles[obj];
				
				for(let i=0; i< path.length ; i++)
				{
					let path2;
					path2 = changeSlash(path[i]);
					liste_current_chemins.push(path2);
				}
				
			}


			if(obj != "@extends")
			{
				//console.log(parsed.configurationProfiles[obj]);

				for(let obj2 in parsed.configurationProfiles[obj])
				{
					//console.log(parsed.configurationProfiles[obj][obj2]);

					for(let obj3 in parsed.configurationProfiles[obj][obj2])
					{
						if(obj3 == '@id')
						{
							//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
							liste_ids.push(parsed.configurationProfiles[obj][obj2][obj3]);
						}

						if(obj3 == '@extends')
						{
							if(!liste_extends.includes(parsed.configurationProfiles[obj][obj2][obj3]))
							{
								//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
								liste_extends.push(parsed.configurationProfiles[obj][obj2][obj3]);
							}

						}
					}
				}
			}
		}

		console.log(liste_current_chemins);
		console.log(liste_ids);
		console.log(liste_extends);

		var selection = editor.selection;

//////////////////////////////////////////////////////////////

// CHANGEMENT DU CURSEUR

		const position = editor.selection.active;

		console.log("position");
		console.log(position);

		var newPosition = position.with(position.line, 0);
		var newSelection = new vscode.Selection(newPosition, newPosition);
		editor.selection = newSelection;

		console.log("newPosition");
		console.log(newPosition);

//////////////////////////////////////////////////////////////


		var number_line_selection = selection.start.line;
		console.log("number_line_selection");
		console.log(number_line_selection);
		//var text = editor.document.getText(selection);

		var array_Line = editor.document.lineAt(number_line_selection);

		var line_selected = array_Line._text;

		line_selected = line_selected.trim();

		//var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		//var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);


		//console.log(line_selected);
		//console.log(line_selected.length);
		//console.log(start);

		if(line_selected.includes(".json"))
		{
			console.log("Ceci est un Chemin");
			console.log("Voici tous les chemins en haut du document");
			console.log(liste_current_chemins);

			// NETTOYAGE DE LA SELECTION

			console.log(line_selected);
			line_selected = changeSlash(line_selected);
			line_selected = line_selected.replace(',','');


			while(line_selected.includes('"'))
			{
				line_selected = line_selected.replace('"','');
			}
			console.log(line_selected);

			for(let i=0;i<liste_fichiers_json.length;i++)
			{
				if(liste_fichiers_json[i].includes(line_selected))
				{
					openFile(liste_fichiers_json[i]);
				}
			}

		}


		else
		{

			// SI SELECTION EST UN EXTENDS
			if(regexpObj.test(line_selected))
			{
				let selected_extend;
				let selected_id;
				let current_paths = [];

				console.log("ceci est un extends");


				// ON EXTRAIT INFO POUR TROUVER SELECTED_EXTEND
				var indices = [];
				for(var i=0; i<line_selected.length;i++)
				{
    				if (line_selected[i] === "\"") indices.push(i);
				}
				let soustraction = indices[indices.length-1] - indices[indices.length-2];

				selected_extend = line_selected.substr(indices[indices.length-2]+1,soustraction-1);
				console.log("selected_extend");
				console.log(selected_extend);
				console.log(selected_extend.length);

				var indices2 = [];
				for(var i=0; i<selected_extend.length;i++)
				{
    				if (selected_extend[i] === "/") indices2.push(i);
				}

				let soustraction2 = selected_extend.length - indices2[indices2.length-1]; 
				
				selected_id = selected_extend.substr(indices2[indices2.length-1]+1,soustraction2);


				// ON A SELECTED_ID et SELECTED_EXTEND

				console.log("selected_id");
				console.log(selected_id);


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


				
				let finish = 0;

				
				for(let k=0;k<5;k++)
				{

					console.log("k");
					console.log(k);
					
					liste_current_chemins=[];
					liste_ids=[];
					liste_extends=[];

					console.log("current_Document_Name");
					console.log(current_Document_Name);

					var Data = fs.readFileSync(current_Document_Name,'utf8'); 

					var str = Data;

					// JSON PARSER

					var parsed = JSON.parse(str);

					for(let obj in parsed.configurationProfiles)
					{
						if(obj == "@extends")
						{
							//console.log("chemins en haut du fichier");
							let path = parsed.configurationProfiles[obj];
			
							for(let i=0; i< path.length ; i++)
							{
								let path2;
								path2 = changeSlash(path[i]);
								liste_current_chemins.push(path2);
							}
						}

						if(obj != "@extends")
						{
							//console.log(parsed.configurationProfiles[obj]);

							for(let obj2 in parsed.configurationProfiles[obj])
							{
								//console.log(parsed.configurationProfiles[obj][obj2]);

								for(let obj3 in parsed.configurationProfiles[obj][obj2])
								{
									if(obj3 == '@id')
									{
										//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
										liste_ids.push(parsed.configurationProfiles[obj][obj2][obj3]);
									}

									if(obj3 == '@extends')
									{
										if(!liste_extends.includes(parsed.configurationProfiles[obj][obj2][obj3]))
										{
											//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
											liste_extends.push(parsed.configurationProfiles[obj][obj2][obj3]);
										}

									}
								}
							}
						}
					}

					console.log(liste_current_chemins);
					console.log(liste_ids);
					console.log(liste_extends);

					//SI ID PRESENT DANS CURRENT FILE

					for(let i=0; i<liste_ids.length-1;i++)
					{
						if(liste_ids[i] == selected_id)
						{
							console.log("ID présent current file !");
							k=4;
							console.log("PRESENCE A L'INDICE :");
							let IND = getIndicesOf(Data,"\"@id\": \""+selected_id+"\"");
							console.log(IND);
						}
					}


					console.log("finish -3");
					console.log(finish);

				
					//SI ID PAS PRESENT DANS CURRENT FILE


					for(let c = 0;c<liste_current_chemins.length;c++)
					{
						for(let i=0;i<liste_fichiers_json.length;i++)
						{
							if(liste_fichiers_json[i].includes(liste_current_chemins[c]))
							{
								current_paths.push(liste_fichiers_json[i]);
								//finish = 1;
							}
						}
					}

					console.log("finish -2");
					console.log(finish);

					console.log("current_paths");

					console.log(current_paths);

					for(let i=0;i<current_paths.length;i++)
					{
						liste_ids = [];
						liste_extends= [];


						console.log(current_paths[i]);

						var Data = fs.readFileSync(current_paths[i],'utf8'); 

						var str = Data;

						// JSON PARSER

						var parsed = JSON.parse(str);

						for(let obj in parsed.configurationProfiles)
						{
							if(obj == "@extends")
							{
								//console.log("chemins en haut du fichier");
								let path = parsed.configurationProfiles[obj];
				
								for(let i=0; i< path.length ; i++)
								{
									let path2;
									path2 = changeSlash(path[i]);
									liste_current_chemins.push(path2);
								}
							}

							if(obj != "@extends")
							{
								//console.log(parsed.configurationProfiles[obj]);

								for(let obj2 in parsed.configurationProfiles[obj])
								{
									//console.log(parsed.configurationProfiles[obj][obj2]);

									for(let obj3 in parsed.configurationProfiles[obj][obj2])
									{
										if(obj3 == '@id')
										{
											//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
											liste_ids.push(parsed.configurationProfiles[obj][obj2][obj3]);
										}

										if(obj3 == '@extends')
										{
											if(!liste_extends.includes(parsed.configurationProfiles[obj][obj2][obj3]))
											{
												//console.log(parsed.configurationProfiles[obj][obj2][obj3]);
												liste_extends.push(parsed.configurationProfiles[obj][obj2][obj3]);
											}

										}
									}
								}
							}
						}
					
						//Remplissage de la map_ids avec [nom fichier] et [liste_ids]

						map_ids[current_paths[i]] = map_ids[current_paths[i]] || [];
						map_extends[current_paths[i]] = map_extends[current_paths[i]] || [];
				
						//console.log("liste_ids");
						//console.log(liste_ids);

						//console.log("map_ids");

						const iterator_ids = liste_ids.values();
				
						for (const value of iterator_ids)
						{
							map_ids[current_paths[i]].push(value);
						}

						const iterator_extends = liste_extends.values();
				
						for (const value of iterator_extends)
						{
							map_extends[current_paths[i]].push(value);
						}


					}

					console.log("finish -1");
					console.log(finish);

					console.log("liste_ids");
					console.log(liste_ids);
					console.log("liste_extends");
					console.log(liste_extends);

					console.log("map_ids");
					console.log(map_ids);

					console.log("map_extends");
					console.log(map_extends);

					// SI ID TROUVé DANS UN FICHIER, OUVERTURE DE CELUI-CI
					
					for(let i=0;i<current_paths.length;i++)
					{
						for(let j=0;j<map_ids[current_paths[i]].length;j++)
						{
							if(map_ids[current_paths[i]][j]==selected_id)
							{
								console.log("ID TROUVé !");
								console.log(current_paths[i]);
								openFile(current_paths[i]);
								k=4;


								var Data2 = fs.readFileSync(current_paths[i],'utf8'); 

								console.log("PRESENCE A L'INDICE :");
								console.log(Data2);
								let IND = getIndicesOf(Data2,"\"@id\": \""+selected_id+"\"");
								console.log(IND);


								/*

								const position = editor.selection.active;

								console.log("position");
								console.log(position);
						
								var newPosition = position.with(500,0);
								var newSelection = new vscode.Selection(newPosition, newPosition);
								editor.selection = newSelection;

								console.log(editor.selection.line);
						
								console.log("newPosition");
								console.log(newPosition);

								console.log("PATH ACTUEL");
								console.log(vscode.window.activeTextEditor.document.uri.fsPath);

								//  code --goto src/app/pages/main.tsx:24:9

								var exec = require('child_process').exec, child;

								child = exec('code --goto '+current_paths[i]+':5',
    							function (error, stdout, stderr) {
								console.log('stdout: ' + stdout);
								console.log('stderr: ' + stderr);
								if (error !== null)
								{
									console.log('exec error: ' + error);
								} });
								child();


								*/
							}
						}
					}

					console.log("finish 0");
					console.log(finish);


					//RECHERCHE DE L'EXTENDS DANS CHEMINS DU HAUT

					for(let i=0;i<current_paths.length;i++)
					{
						for(let j=0;j<map_extends[current_paths[i]].length;j++)
						{
							//console.log(map_extends[current_paths[i]][j]);
							if(map_extends[current_paths[i]][j]==selected_extend)
							{
								console.log("EXTENDS TROUVé !");
								//console.log(current_paths[i]);
								current_Document_Name = current_paths[i];
								console.log("current_Document_Name");
								console.log(current_Document_Name);
								//finish = 1;
								//openFile(current_paths[i]);
							}
						}
					}

					console.log("current_Document_Name END");
					console.log(current_Document_Name);

					console.log("finish 1");
					console.log(finish);

				}

				console.log("finish 2");
				console.log(finish);


			}

			else
			{
				console.log("Ni un chemin ni un extends");
			}


		}


	vscode.window.showInformationMessage('Hello from JSON_reading!');
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
