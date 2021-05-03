document.querySelector("body").insertAdjacentHTML(
  "beforeend",
  `<div id="ld_console" class="opened">
		<div class="header">
		<button onclick="document.rBot.connect()">CONNECT</button>
		<button onclick="document.rBot.harvest('STEP-USDC LP')">harvest</button>
		<button onclick="document.rBot.debug()">DEBUG</button>
		<button onclick="document.rBot.swap('STEP', 'USDC')">swap</button>
		<button onclick="document.rBot.autoharvest()">autoharvest</button>
		</div>
		<div class="inner">
		</div>
		<div class="toggler"></div>
	</div>`
);
document
  .querySelector("#ld_console .toggler")
  .addEventListener("click", function () {
    document.querySelector("#ld_console").classList.toggle("opened");
  });

class RaydiumBot {
	constructor(){
		this.logs = [];
	}
	swap(token1, token2){
		return new Promise(r => {
			this.goToTab('swap').then(() => {
				this.wait("#__layout .coin-select > div.label.fs-container > span", 'From').then(item => {
					let btn = item.parentElement.parentElement.querySelector('button.select-button').click();
					this.wait(".ant-modal-content .token-info div", token1).then(item => {
						item.parentElement.click();

						
						this.wait("#__layout .coin-select > div.label.fs-container > span", 'To (Estimate)').then(item => {
							let btn = item.parentElement.parentElement.querySelector('button.select-button').click();
							this.wait(".ant-modal-content .token-info div", token2).then(item => {
								item.parentElement.click();

								let balance = parseFloat(document.querySelectorAll("#__layout .coin-select > div.label.fs-container > span:last-child")[0].innerText.split(" ")[1]) / 2;
								this.log('Try to swap ' +token1+' for '+token2+"...");
								document.querySelectorAll(".coin-select input[type=text]")[0].value = balance;
								document.querySelectorAll(".coin-select input[type=text]")[0].dispatchEvent(new Event('input', { bubbles: true }));
								this.wait(".card-body button", 'Swap').then(item => {
									item.click();
									this.wait("div.ant-notification-notice-message", "Transaction has been confirmed").then(notification => {
										notification.parentElement.parentElement.remove();
										this.log('SWAPED '+balance+token1+" for "+document.querySelectorAll(".coin-select input[type=text]")[1].value+token2);
										r();
									});
								});
							})
						});
					})
				});
			});
		});
	}
	debug() {		
		setInterval(() => {
			if(!this.isConnected()){
			  this.log("Not connected yet...");
			  this.connect().then(r => {
				this.harvest('STEP-USDC LP');
			  });
			} else {
				this.harvest('STEP-USDC LP');
			}
		})
	}
	autoharvest() {		
		this.log("Starting Auto Harvest...");
		setInterval(() => {
			if(!this.isConnected()){
			  this.log("Not connected yet...");
			  this.connect().then(r => {
				this.harvest('STEP-USDC LP');
			  });
			} else {
				this.harvest('STEP-USDC LP');
			}
		}, 5*60*1000 );
	}
	sendMail (subject, body) {
		fetch('https://api.leodesigaux.com/notify', {
			method: 'POST',
			headers: {
			  'Accept': 'application/json',
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({code: 'hellohibotr', subject: subject, body: body})
		});
	}
  goToTab(path) {
	return new Promise(r => {
		let titles = {
			'fusion': 'Fusion Pools',
			'swap': 'Swap',
			'liquidity': 'Add Liquidity'
		}
		this.log("Changing page to "+path+"...");
		console.log(document.querySelectorAll("#__layout section header li.ant-menu-item"));
		this.wait("#__layout section header li.ant-menu-item", path[0].toUpperCase() + path.substring(1)).then(pageButton => {
			pageButton.click();
			this.wait('#__layout > section > main > div > div.page-head.fs-container', titles[path]).then(solletButton => {
				this.log("We are on "+path+" page");
				r();
			});
		});
	});
  }
  harvest (tokenName){
	return new Promise(r => {
		this.goToTab('fusion').then(() => {
			this.wait("#__layout .ant-collapse-item div.lp-icons.ant-col.ant-col-8", tokenName).then(item => {
				if(document.querySelector('.ant-collapse-item-active') == null){
					this.log("Deploy "+tokenName+"...");
					item.parentElement.parentElement.click();
				}
				let collaspeItem = item.parentElement.parentElement.parentElement;
				console.log(collaspeItem);
				this.wait(".pending > button", "Harvest", collaspeItem).then(harvestButton => {
					console.log(harvestButton);
					this.log('Harvesting...')
					let reward = document.querySelector('.reward .token').innerText+" ";
					harvestButton.click();
					this.wait("div.ant-notification-notice-message", "Transaction has been confirmed").then(notification => {
						notification.parentElement.parentElement.remove();
						this.log('Harvested '+reward);
						this.sendMail('Harvested '+reward, this.logs.join("<br>"));
						this.logs = [];
					});
				});
			});
		});
	});
  }
  connect(){
	return new Promise(r => {
		this.log("Try to connect wallet...");
		this.wait("#__layout > section > header > div.fs-container > div > button", 'Connect').then(connectButton => {
			connectButton.click();
			this.wait('.ant-btn.ant-btn-background-ghost', 'Sollet').then(solletButton => {
				solletButton.click();
				this.wait('body > div.ant-notification.ant-notification-bottomLeft > span > div > div > div > div.ant-notification-notice-message', 'Wallet connected').then(btn => {
					btn.parentElement.parentElement.parentElement.remove()
					this.log("Wallet is Connected");
					r();
				});
			});
		});
	});
  }
  isConnected(){
	  return document.querySelector("#__layout > section > header > div.fs-container > div > button").innerText !== "Connect"
  }
  wait(selector, text, root = document){
	return new Promise(r => {
		this.interval = setInterval(() => {
			if(root.querySelectorAll(selector) != null){
				root.querySelectorAll(selector).forEach(item => {
					if(text != null){
						if(item.innerText === text){
							console.log(item.innerText);
							clearInterval(this.interval);
							setTimeout(e => { r(item); }, 500)
						}
					} else {
						clearInterval(this.interval);
						setTimeout(e => { r(item); }, 500)
					}
				})
			}
		}, 50)
	});
  }
  log(txt) {
	this.logs.push(`[`+new Date().toISOString().slice(2, 23).replace("T"," ")+`] ` + txt)
	console.log(`[`+new Date().toISOString().slice(2, 23).replace("T"," ")+`] ` + txt)
    document.querySelector("#ld_console .inner").insertAdjacentHTML("beforeend", `<p><span>[`+new Date().toISOString().slice(2, 23).replace("T"," ")+`]</span> ` + txt + `</p>`);
	document.querySelector("#ld_console .inner").scrollBy(0, 9999999)
  }
}
document.rBot = new RaydiumBot();
