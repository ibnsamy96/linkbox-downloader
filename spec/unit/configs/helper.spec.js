import * as helpers from "../../../src/configs/helpers.js"

describe("Testing Proxies", () => {
	const proxies = {
		unreachable: [
			{ protocol: "http", host: "192.188.1.5", port: "8080" },
			{ protocol: "http", host: "192.168.1.5", port: "7070" },
			{ protocol: "http", host: "172.188.1.5", port: "8080" },
		],
		reachableNotValid: [
			{
				protocol: "http",
				host: "192.168.1.5",
				port: "8080",
			},
		],

		reachableNotChangingIP: [
			{
				protocol: "http",
				host: "192.168.1.5",
				port: "8080",
				username: "user",
				password: "user",
			},
			{
				protocol: "http",
				host: "172.67.167.106",
				port: "80",
			},
			{
				protocol: "http",
				host: "45.8.105.126",
				port: "80",
			},
		],
		reachableChangingIP: [
			{
				protocol: "http",
				host: "190.104.173.62",
				port: "80",
			},
			{
				protocol: "http",
				host: "103.74.121.88",
				port: "3128",
			},
			// {
			// 	// fast
			// 	protocol: "http",
			// 	host: "162.212.153.95",
			// 	port: "8080",
			// },
			// {
			// 	protocol: "http",
			// 	host: "101.229.247.5",
			// 	port: "9002",
			// },
		],
	}

	it("check unreachable proxies", async () => {
		//console.log(proxies.unreachable)
		for (const proxy of proxies.unreachable) {
			const testResult = await helpers.isProxyReachableAndChangingIP(proxy)
			expect(Object.keys(testResult)).toHaveSize(3)
			expect(Object.keys(testResult)).toContain("changingIP")
			expect(Object.keys(testResult)).toContain("isReturnValid")
			expect(Object.keys(testResult)).toContain("reachable")
			expect(testResult.reachable).toBeFalse()
			expect(testResult.isReturnValid).toBeFalse()
			expect(testResult.changingIP).toBeFalse()
			//console.log(
			//`	${proxy.protocol}://${proxy.host}:${proxy.port} / ${Object.keys(
			//					testResult
			//				)} / ${Object.values(testResult)}`
			//			)
		}
	}, 60000)

	it("check reachable not valid proxies", async () => {
		//console.log(proxies.reachableNotValid)

		for (const proxy of proxies.reachableNotValid) {
			const testResult = await helpers.isProxyReachableAndChangingIP(proxy)
			expect(Object.keys(testResult)).toHaveSize(3)
			expect(Object.keys(testResult)).toContain("changingIP")
			expect(Object.keys(testResult)).toContain("isReturnValid")
			expect(Object.keys(testResult)).toContain("reachable")
			expect(testResult.reachable).toBeTrue()
			expect(testResult.isReturnValid).toBeFalse()
			expect(testResult.changingIP).toBeFalse()
			//console.log(
			//`	${proxy.protocol}://${proxy.host}:${proxy.port} / ${Object.keys(
			//					testResult
			//				)} / ${Object.values(testResult)}`
			//			)
		}
	}, 60000)

	it("check reachable not changing IPs proxies", async () => {
		//console.log(proxies.reachableNotChangingIP)

		for (const proxy of proxies.reachableNotChangingIP) {
			const testResult = await helpers.isProxyReachableAndChangingIP(proxy)
			expect(Object.keys(testResult)).toHaveSize(3)
			expect(Object.keys(testResult)).toContain("changingIP")
			expect(Object.keys(testResult)).toContain("isReturnValid")
			expect(Object.keys(testResult)).toContain("reachable")
			expect(testResult.reachable).toBeTrue()
			expect(testResult.isReturnValid).toBeTrue()
			expect(testResult.changingIP).toBeFalse()
			//console.log(
			//`	${proxy.protocol}://${proxy.host}:${proxy.port} / ${Object.keys(
			//					testResult
			//				)} / ${Object.values(testResult)}`
			//			)
		}
	}, 60000)

	fit("check reachable changing IPs proxies", async () => {
		//console.log(proxies.reachableChangingIP)

		for (const proxy of proxies.reachableChangingIP) {
			const testResult = await helpers.isProxyReachableAndChangingIP(proxy)
			// console.log(
			// 	`	${proxy.protocol}://${proxy.host}:${proxy.port} / ${Object.keys(
			// 		testResult
			// 	)} / ${Object.values(testResult)}`
			// )

			expect(Object.keys(testResult)).toHaveSize(3)
			expect(Object.keys(testResult)).toContain("changingIP")
			expect(Object.keys(testResult)).toContain("isReturnValid")
			expect(Object.keys(testResult)).toContain("reachable")
			expect(testResult.reachable).toBeTrue()
			expect(testResult.isReturnValid).toBeTrue()
			expect(testResult.changingIP).toBeTrue()
		}
	}, 60000)
})
