// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const got = require('got');
const {XMLParser} = require('fast-xml-parser')
const parser = new XMLParser();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	// load articles for the first time
	var articles = await getXML()
	vscode.window.showInformationMessage('Feeds downloaded.')

	// Show articles
	let get = vscode.commands.registerCommand('rss-latest-feed.getFeed', async function () {
		const article = await vscode.window.showQuickPick(articles, {
			matchOnDetail: true
		})
		if (article == null) return

		vscode.env.openExternal(article.link)
	});

	// reload articles
	let reload = vscode.commands.registerCommand('rss-latest-feed.reloadFeed', async function () {
		articles = await getXML()
		vscode.window.showInformationMessage('Feeds downloaded.')
	})

	context.subscriptions.push(get);
	context.subscriptions.push(reload)

}

async function getXML() {
	// try to get urls from config file
	try{
		var conf = vscode.workspace.getConfiguration().rsslatestfeed.feeds
	}catch(error){
		// No settings
		vscode.window.showInformationMessage('No RSS feed in settings.')
		return []
	}
	// download all
	vscode.window.showInformationMessage('Downloading feeds.')
	var result = []
	for (var k in conf) {
		try{
			const res = await got(conf[k], {https: {rejectUnauthorized: false}})
			const articles = parser.parse(res.body).rss.channel.item.map(
				article => {
					return{
						label: article.title,
						detail: article.description,
						link: article.link,
						date: article.pubDate,
					}
				}
			)
			result = result.concat(articles)
		}catch (error){
			vscode.window.showInformationMessage("Couldn't fetch " + conf[k] +".")
		}
	}

	// return sorted by date DESC
	return result.sort(function(a,b){
		return (new Date(b.date) - (new Date(a.date)))
	})
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
