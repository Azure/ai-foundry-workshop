import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { api } from "../lib/api"
import type { TrialResponse, DigitalTwinResponse } from "../types/api"

export function TrialsPage() {
  const [trials, setTrials] = useState<TrialResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<DigitalTwinResponse | null>(null)

  const fetchTrials = async (file?: File) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await api.getTrialData(file)
      if (apiError) {
        throw new Error(apiError)
      }
      if (data) {
        setTrials(data)
        if (data.trials.length > 0) {
          const firstTrial = data.trials[0]
          runSimulation({
            molecule_parameters: {
              id: firstTrial.id,
              phase: firstTrial.phase
            },
            target_population: {
              size: firstTrial.participants,
              conditions: firstTrial.conditions
            }
          })
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch trial data")
      setTrials(null)
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = async (params: {
    molecule_parameters: Record<string, any>
    target_population: Record<string, any>
  }) => {
    setSimulating(true)
    try {
      const { data, error: apiError } = await api.runDigitalTwinSimulation({
        ...params,
        simulation_config: {
          duration_months: 12,
          include_adverse_events: true
        }
      })
      if (apiError) {
        throw new Error(apiError)
      }
      if (data) {
        setSimulationResult(data)
      }
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setSimulating(false)
    }
  }

  useEffect(() => {
    console.log('Fetching trials data...')
    fetchTrials()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading clinical trials data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Clinical Trials Monitor</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Monitor and analyze ongoing clinical trials.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                fetchTrials(file)
              }
            }}
            className="hidden"
            id="trial-data-upload"
          />
          <label
            htmlFor="trial-data-upload"
            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            Upload Trial Data
          </label>
          <Button
            onClick={() => fetchTrials()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span>Loading...</span>
              </div>
            ) : (
              'Load Demo Data'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {trials && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Clinical Trials</h2>
              <div className="grid gap-4">
                {trials.trials.map((trial, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-medium">Trial ID: {trial.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            Phase {trial.phase} • {trial.status}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-secondary">
                          {trial.participants} participants
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Start Date:</span>
                          <span className="ml-2">{new Date(trial.startDate).toLocaleDateString()}</span>
                          {trial.completionDate && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="font-medium">Completion:</span>
                              <span className="ml-2">{new Date(trial.completionDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        
                        <div>
                          <span className="font-medium">Conditions:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {trial.conditions.map((condition, idx) => (
                              <span key={idx} className="px-2 py-1 text-sm bg-secondary rounded-md">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium">Interventions:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {trial.interventions.map((intervention, idx) => (
                              <span key={idx} className="px-2 py-1 text-sm bg-primary/10 rounded-md">
                                {intervention}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Showing {trials.trials.length} of {trials.totalTrials} trials</span>
                <span>Page {trials.page} of {Math.ceil(trials.totalTrials / trials.pageSize)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Digital Twin Simulation</h2>
              {simulating ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <p>Running simulation...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : simulationResult ? (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Population Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Population Size</p>
                          <p className="text-2xl font-semibold">{simulationResult.population_size}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Response Rate</p>
                          <p className="text-2xl font-semibold">{(simulationResult.efficacy_metrics.response_rate * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Survival Gain</h3>
                      <p className="text-2xl font-semibold">{simulationResult.efficacy_metrics.survival_gain}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Toxicity Profile</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mean Score</span>
                          <span className="font-medium">{(simulationResult.toxicity_scores.mean * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Standard Deviation</span>
                          <span className="font-medium">{(simulationResult.toxicity_scores.std * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Adverse Events</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Mild</span>
                          <span className="font-medium">{(simulationResult.adverse_events.mild * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Moderate</span>
                          <span className="font-medium">{(simulationResult.adverse_events.moderate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Severe</span>
                          <span className="font-medium">{(simulationResult.adverse_events.severe * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
