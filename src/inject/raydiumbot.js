document.querySelector("body").insertAdjacentHTML(
  "beforeend",
  `<div id="ld_console" class="opened">
		<div class="header">
		<button onclick="document.rBot.autofarm()">autofarm</button>
		<button onclick="document.rBot.autofarmnow()">autofarmnow</button>
		<button onclick="document.rBot.reconnect()">reconnect</button>
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
										notification.parentElement.parentElement.parentElement.remove();
										this.log('SWAPED '+balance+token1+" for "+document.querySelectorAll(".coin-select input[type=text]")[1].value+token2);
										this.reconnect().then(() => { r(); });
									});
								});
							})
						});
					})
				});
			});
		});
	}
	liquidity(token1, token2){
		return new Promise(r => {
			this.goToTab('liquidity').then(() => {
				this.wait(".card-body .coin-select:nth-child(1) > div.label.fs-container > span", 'Input').then(select1Button => {
					let btn = select1Button.parentElement.parentElement.querySelector('button.select-button').click();
					this.wait(".ant-modal-content .token-info div", token1).then(token1Button => {
						token1Button.parentElement.click();
						this.wait(".card-body .coin-select:nth-child(3) > div.label.fs-container > span", 'Input').then(select2Button => {
							let btn = select2Button.parentElement.parentElement.querySelector('button.select-button').click();
							this.wait(".ant-modal-content .token-info div", token2).then(token2Button => {
								token2Button.parentElement.click();
								this.wait("#__layout .coin-select .max-button", "MAX").then(maxButton => {
									maxButton.click();
									this.wait(".price-base").then(() => {
										let token1Amount = document.querySelector('.card-body .coin-select:nth-child(1) .coin-input input').value;
										let token2Amount = document.querySelector('.card-body .coin-select:nth-child(3) .coin-input input').value;
		
										this.log('Trying to create Liquidity '+token1Amount+" "+token1+" + "+token2Amount+" "+token2);
										console.log(token1Amount, token2Amount);
										this.wait(".card-body button.ant-btn.ant-btn-lg.ant-btn-background-ghost", "Supply").then(supplyButton => {
											supplyButton.click();
											this.wait("div.ant-notification-notice-message", "Transaction has been confirmed").then(notification => {
												notification.parentElement.parentElement.parentElement.remove();
												this.log('Liquidity created '+token1Amount+" "+token1+" + "+token2Amount+" "+token2);
												this.reconnect().then(() => { r(); });
											});
										});
									})
								})
							})
						})
					})
				})
			})
		})
	}
	stake(tokenName) {
		return new Promise(r => {
			this.harvest(tokenName).then(() => {
				this.log('Trying to add '+tokenName+" Liquidity");
				this.wait("#__layout .ant-collapse-item div.lp-icons.ant-col.ant-col-8", tokenName).then(item => {
					if(document.querySelector('.ant-collapse-item-active') == null){
						this.log("Deploy "+tokenName+"...");
						item.parentElement.parentElement.click();
					}
					let collaspeItem = item.parentElement.parentElement.parentElement;
					this.wait("button.ant-btn.ant-btn-lg.ant-btn-background-ghost", "Stake LP", collaspeItem).then(stakeButton => {
						stakeButton.click();
						this.wait(".ant-modal-body .coin-input .max-button", "MAX").then(maxButton => {
							maxButton.click();
							//document.querySelector('.ant-modal-body .coin-input input').value = "0.05";
							//document.querySelector('.ant-modal-body .coin-input input').dispatchEvent(new Event('input', { bubbles: true }));
							let liquidityAmount = document.querySelector('.ant-modal-body .coin-input input').value;
							this.wait(".actions .ant-col-12:last-child button:not([disabled])", 'Confirm').then(confirmButton => {
								confirmButton.click();
								this.wait("div.ant-notification-notice-message", "Transaction has been confirmed").then(notification => {
									notification.parentElement.parentElement.parentElement.remove();
									this.log('Added '+liquidityAmount+" Liquidity");
									this.wait('.ant-modal-body button', 'Cancel').then(btn => {
										btn.click();
										this.sendMail('Added '+liquidityAmount+' '+tokenName, this.logs.join("<br>"));
										this.logs = [];
										r();
									});
								});
							});
						});
					});
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
	autofarm() {		
		this.log("Starting Auto Farm...");
		setInterval(() => {
			this.autofarmnow();
		}, 5*60*1000 );
	}
	autofarmnow() {
		this.reconnect().then(r => {
			this.harvest('STEP-USDC LP').then(r => {
				this.swap('STEP','USDC').then(r => {
					this.liquidity('STEP','USDC').then(r => {
						this.stake('STEP-USDC LP').then(r => {
							this.log('Nice!');
						});
					});
				});
			});
		});
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
				document.querySelector('.ant-progress').click();
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
							notification.parentElement.parentElement.parentElement.remove();
							this.log('Harvested '+reward);
							r();
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
	disconnect(){
		return new Promise(r => {
			this.log("Try to disconnect wallet...");
			this.waitNo("#__layout > section > header > div.fs-container > div > button", 'Connect').then(connectButton => {
				connectButton.click();
				this.wait('.ant-modal-body button.ant-btn.ant-btn-background-ghost', 'DISCONNECT').then(disconnectButton => {
					disconnectButton.click();
					this.wait('.ant-modal-close-x').then(btn => {
						btn.click();
						this.wait('body > div.ant-notification.ant-notification-bottomLeft > span > div > div > div > div.ant-notification-notice-message', 'Wallet disconnected').then(btn => {
							btn.parentElement.parentElement.parentElement.remove()
							this.log("Wallet is Disconnected");
							this.wait("#__layout > section > header > div.fs-container > div > button", 'Connect').then(connectButton => {
								r();
							});
						});
					});
				});
			});
		});
	}
	reconnect(){
		return new Promise(r => {
			if(!this.isConnected()){
				this.connect().then(() => {
					r();
				})
			} else {
				this.disconnect().then( () => {
				  this.connect().then(() => {
					  r();
				  })
				});
			}
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
	waitNo(selector, text, root = document){
		return new Promise(r => {
			this.interval = setInterval(() => {
				if(root.querySelectorAll(selector) != null){
					root.querySelectorAll(selector).forEach(item => {
						if(text != null){
							if(item.innerText !== text){
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
