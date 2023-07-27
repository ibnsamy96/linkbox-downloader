// const SpecReporter = require("jasmine-spec-reporter").SpecReporter
import { SpecReporter } from "jasmine-spec-reporter"

jasmine.getEnv().clearReporters()
jasmine.getEnv().addReporter(
	new SpecReporter({
		spec: {
			displayPending: true,
		},
	})
)
