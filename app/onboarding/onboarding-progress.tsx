import { CheckCircle2 } from "lucide-react"

export function OnboardingProgress({ currentStep, steps, progress }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{steps[currentStep].title}</h1>
          <p className="text-muted-foreground text-lg">{steps[currentStep].description}</p>
        </div>
        <div className="hidden md:flex items-center justify-center bg-primary/10 text-primary font-medium rounded-full px-4 py-2">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      <div className="relative">
        {/* Progress bar */}
        <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="absolute -top-1 w-full flex justify-between px-[1px]">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`
                    w-4 h-4 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-primary scale-100"
                        : isCurrent
                          ? "bg-primary scale-125 ring-4 ring-primary/20"
                          : "bg-muted"
                    }
                  `}
                >
                  {isCompleted && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Step labels */}
        <div className="hidden md:flex justify-between mt-6">
          {steps.map((step, index) => (
            <div
              key={`label-${step.id}`}
              className={`text-xs font-medium w-24 text-center -ml-12 ${
                index === 0 ? "text-left ml-0" : index === steps.length - 1 ? "text-right -mr-12" : ""
              } ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}
              style={{
                transform:
                  index === 0 ? "translateX(0)" : index === steps.length - 1 ? "translateX(0)" : "translateX(-50%)",
              }}
            >
              {step.title}
            </div>
          ))}
        </div>

        {/* Mobile step indicator */}
        <div className="flex md:hidden justify-center mt-6">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <div
                key={`dot-${index}`}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-primary scale-150" : index < currentStep ? "bg-primary" : "bg-muted"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
