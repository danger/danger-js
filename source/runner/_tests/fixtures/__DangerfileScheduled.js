schedule(
	new Promise(res => {
		setTimeout(() => {
			warn("Asynchronous Warning")
			res()
		}, 10)
	})
)
