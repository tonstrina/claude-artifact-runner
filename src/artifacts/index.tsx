import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Calendar, TrendingUp, Dumbbell, Clock, CheckCircle2, Plus, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';

const WeightliftingApp = () => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [exerciseWeights, setExerciseWeights] = useState<{ [key: string]: string }>({});
  const [completedSets, setCompletedSets] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('workout');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const workoutProgram = {
    1: { // Day 1: Upper Body
      name: "Upper Body Focus",
      warmup: "5-10 minutes light cardio + arm circles and shoulder rolls",
      exercises: [
        { 
          name: "Chest Press", 
          sets: 3, 
          reps: "8-12", 
          rest: 75, 
          type: "dumbbell or machine",
          instructions: {
            setup: "Lie on a bench with feet flat on floor. Hold dumbbells or use machine with handles at chest level.",
            execution: "Press weights up and slightly in towards center, then lower with control to chest level.",
            breathing: "Exhale on the push, inhale on the lower.",
            tips: "Keep shoulder blades pulled back. Don't arch your back excessively."
          }
        },
        { 
          name: "Seated Row", 
          sets: 3, 
          reps: "10-12", 
          rest: 75, 
          type: "cable or machine",
          instructions: {
            setup: "Sit upright with chest out, grab handles with neutral grip. Start with arms extended.",
            execution: "Pull handles to your lower ribs, squeezing shoulder blades together. Return with control.",
            breathing: "Exhale on the pull, inhale on the return.",
            tips: "Lead with your elbows, not your hands. Keep torso stable throughout."
          }
        },
        { 
          name: "Shoulder Press", 
          sets: 3, 
          reps: "8-10", 
          rest: 75, 
          type: "dumbbell, seated",
          instructions: {
            setup: "Sit with back support, hold dumbbells at shoulder height with palms facing forward.",
            execution: "Press weights straight up until arms are extended, then lower to start position.",
            breathing: "Exhale on the press, inhale on the lower.",
            tips: "Don't press behind your head. Keep core engaged to protect lower back."
          }
        },
        { 
          name: "Lat Pulldown", 
          sets: 3, 
          reps: "10-12", 
          rest: 75, 
          type: "machine",
          instructions: {
            setup: "Sit with thighs secured under pads. Grab bar with wide overhand grip.",
            execution: "Pull bar down to upper chest, leading with elbows. Squeeze lats at bottom.",
            breathing: "Exhale on the pull, inhale on the return.",
            tips: "Lean back slightly. Focus on pulling with your back, not your arms."
          }
        },
        { 
          name: "Tricep Extensions", 
          sets: 2, 
          reps: "10-15", 
          rest: 60, 
          type: "cable or dumbbell",
          instructions: {
            setup: "Stand upright holding weight overhead with both hands, or use cable with rope attachment.",
            execution: "Lower weight behind head by bending elbows, then extend back to start.",
            breathing: "Exhale on the extension, inhale on the lower.",
            tips: "Keep elbows stationary and pointing forward. Control the negative portion."
          }
        },
        { 
          name: "Bicep Curls", 
          sets: 2, 
          reps: "10-15", 
          rest: 60, 
          type: "dumbbell",
          instructions: {
            setup: "Stand with dumbbells at sides, palms facing forward, elbows close to torso.",
            execution: "Curl weights up by flexing biceps, then lower with control.",
            breathing: "Exhale on the curl, inhale on the lower.",
            tips: "Don't swing or use momentum. Keep elbows stationary at your sides."
          }
        }
      ]
    },
    2: { // Day 2: Lower Body
      name: "Lower Body Focus",
      warmup: "5-10 minutes light cardio + leg swings and hip circles",
      exercises: [
        { 
          name: "Goblet Squats", 
          sets: 3, 
          reps: "10-15", 
          rest: 90, 
          type: "dumbbell or kettlebell",
          instructions: {
            setup: "Hold weight at chest level with both hands. Stand with feet shoulder-width apart.",
            execution: "Squat down by pushing hips back and bending knees. Return to standing.",
            breathing: "Inhale on the descent, exhale on the ascent.",
            tips: "Keep chest up and knees tracking over toes. Go as low as mobility allows."
          }
        },
        { 
          name: "Romanian Deadlifts", 
          sets: 3, 
          reps: "8-12", 
          rest: 90, 
          type: "dumbbells",
          instructions: {
            setup: "Hold dumbbells in front of thighs with overhand grip. Stand with slight knee bend.",
            execution: "Hinge at hips, pushing them back while lowering weights. Return by driving hips forward.",
            breathing: "Inhale on the lower, exhale on the return.",
            tips: "Keep weights close to legs. Feel stretch in hamstrings, not lower back."
          }
        },
        { 
          name: "Leg Press", 
          sets: 3, 
          reps: "12-15", 
          rest: 75, 
          type: "machine",
          instructions: {
            setup: "Sit in machine with back against pad. Place feet on platform shoulder-width apart.",
            execution: "Lower platform by bending knees to 90 degrees, then press back to start.",
            breathing: "Inhale on the lower, exhale on the press.",
            tips: "Keep knees aligned with toes. Don't lock knees completely at top."
          }
        },
        { 
          name: "Walking Lunges", 
          sets: 2, 
          reps: "10 per leg", 
          rest: 60, 
          type: "bodyweight or light dumbbells",
          instructions: {
            setup: "Stand upright with hands on hips or holding light weights at sides.",
            execution: "Step forward into lunge, lowering back knee toward ground. Step forward with other leg.",
            breathing: "Natural breathing pattern throughout the movement.",
            tips: "Keep front knee over ankle. Push off front heel to step forward."
          }
        },
        { 
          name: "Calf Raises", 
          sets: 3, 
          reps: "15-20", 
          rest: 45, 
          type: "standing",
          instructions: {
            setup: "Stand upright with balls of feet on platform or floor, heels hanging free.",
            execution: "Rise up on toes as high as possible, then lower heels below platform level.",
            breathing: "Exhale on the raise, inhale on the lower.",
            tips: "Hold briefly at the top. Control the negative for better muscle activation."
          }
        },
        { 
          name: "Glute Bridges", 
          sets: 2, 
          reps: "15-20", 
          rest: 45, 
          type: "bodyweight",
          instructions: {
            setup: "Lie on back with knees bent, feet flat on floor, arms at sides.",
            execution: "Squeeze glutes and lift hips up, creating straight line from knees to shoulders.",
            breathing: "Exhale on the lift, inhale on the lower.",
            tips: "Squeeze glutes at top. Don't arch back excessively."
          }
        }
      ]
    },
    3: { // Day 3: Full Body Circuit
      name: "Full Body Circuit",
      warmup: "5-10 minutes light cardio + dynamic stretching",
      exercises: [
        { 
          name: "Push-ups", 
          sets: 3, 
          reps: "8-12", 
          rest: 180, 
          type: "modified on knees if needed", 
          isCircuit: true,
          instructions: {
            setup: "Start in plank position with hands slightly wider than shoulders, or on knees for modification.",
            execution: "Lower chest to floor, then push back up to start position.",
            breathing: "Inhale on the lower, exhale on the push.",
            tips: "Keep body in straight line. Modify on knees if needed."
          }
        },
        { 
          name: "Bodyweight Squats", 
          sets: 3, 
          reps: "12-15", 
          rest: 0, 
          type: "", 
          isCircuit: true,
          instructions: {
            setup: "Stand with feet shoulder-width apart, toes slightly pointed out.",
            execution: "Squat down by pushing hips back, then return to standing.",
            breathing: "Inhale on the descent, exhale on the ascent.",
            tips: "Keep chest up and weight on heels. Go as low as comfortable."
          }
        },
        { 
          name: "Bent-over Dumbbell Rows", 
          sets: 3, 
          reps: "10-12", 
          rest: 0, 
          type: "", 
          isCircuit: true,
          instructions: {
            setup: "Hold dumbbells, hinge at hips with slight knee bend, chest up.",
            execution: "Pull weights to lower ribs, squeezing shoulder blades. Lower with control.",
            breathing: "Exhale on the pull, inhale on the lower.",
            tips: "Keep back flat. Lead with elbows, not hands."
          }
        },
        { 
          name: "Plank Hold", 
          sets: 3, 
          reps: "20-45 sec", 
          rest: 0, 
          type: "", 
          isCircuit: true,
          instructions: {
            setup: "Start in push-up position with forearms on ground, elbows under shoulders.",
            execution: "Hold position, keeping body in straight line from head to heels.",
            breathing: "Breathe normally throughout the hold.",
            tips: "Engage core and glutes. Don't let hips sag or pike up."
          }
        },
        { 
          name: "Overhead Press", 
          sets: 3, 
          reps: "8-10", 
          rest: 0, 
          type: "light dumbbells", 
          isCircuit: true,
          instructions: {
            setup: "Stand with feet shoulder-width apart, dumbbells at shoulder height.",
            execution: "Press weights straight up until arms extended, then lower to start.",
            breathing: "Exhale on the press, inhale on the lower.",
            tips: "Keep core tight. Don't arch back excessively."
          }
        },
        { 
          name: "Step-ups", 
          sets: 3, 
          reps: "10 per leg", 
          rest: 180, 
          type: "using bench or sturdy platform", 
          isCircuit: true,
          instructions: {
            setup: "Stand in front of a sturdy bench or platform about knee height.",
            execution: "Step up with one foot, drive through heel to stand on platform. Step down with control.",
            breathing: "Natural breathing pattern throughout.",
            tips: "Use the stepping leg to lift, don't push off the ground leg."
          }
        }
      ]
    }
  } as { [key: number]: any };

  const getCurrentPhase = () => {
    if (currentWeek <= 2) return { phase: "Foundation Phase", focus: "Learning proper form, lighter weights" };
    if (currentWeek <= 6) return { phase: "Building Phase", focus: "Gradual weight increases, adding reps" };
    return { phase: "Strength Phase", focus: "Progressive overload, challenging weights" };
  };

  useEffect(() => {
    if (isTimerRunning && restTime > 0) {
      timerRef.current = setTimeout(() => {
        setRestTime(prev => prev - 1);
      }, 1000);
    } else if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsResting(false);
      alert("Rest time complete! Ready for next set.");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [restTime, isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRest = (duration: number) => {
    setRestTime(duration);
    setIsResting(true);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsResting(false);
    setRestTime(0);
  };

  const completeSet = () => {
    const key = `w${currentWeek}-d${currentDay}-e${currentExercise}-s${currentSet}`;
    setCompletedSets(prev => ({...prev, [key]: true}));
    
    const currentExerciseData = workoutProgram[currentDay].exercises[currentExercise];
    if (currentSet < currentExerciseData.sets - 1) {
      setCurrentSet(prev => prev + 1);
      if (currentExerciseData.rest > 0) {
        startRest(currentExerciseData.rest);
      }
    } else if (currentExercise < workoutProgram[currentDay].exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setCurrentSet(0);
    }
  };

  const updateWeight = (exerciseIndex: number, weight: string | number) => {
    const key = `w${currentWeek}-d${currentDay}-e${exerciseIndex}`;
    setExerciseWeights(prev => ({...prev, [key]: weight.toString()}));
  };

  const getWeight = (exerciseIndex: number) => {
    const key = `w${currentWeek}-d${currentDay}-e${exerciseIndex}`;
    return exerciseWeights[key] || '';
  };

  const isSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const key = `w${currentWeek}-d${currentDay}-e${exerciseIndex}-s${setIndex}`;
    return completedSets[key] || false;
  };

  const resetWorkout = () => {
    setCurrentExercise(0);
    setCurrentSet(0);
    setIsResting(false);
    setRestTime(0);
    setIsTimerRunning(false);
    setCompletedSets({});
  };

  const getCompletionStats = () => {
    const totalExercises = workoutProgram[currentDay].exercises.length;
    let completedExercises = 0;
    
    workoutProgram[currentDay].exercises.forEach((exercise: any, exerciseIndex: number) => {
      const exerciseCompleted = workoutProgram[currentDay].exercises[exerciseIndex].sets;
      let setsCompleted = 0;
      for (let setIndex = 0; setIndex < exerciseCompleted; setIndex++) {
        if (isSetCompleted(exerciseIndex, setIndex)) setsCompleted++;
      }
      if (setsCompleted === exerciseCompleted) completedExercises++;
    });
    
    return { completed: completedExercises, total: totalExercises };
  };

  const renderWorkoutView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Week {currentWeek} • Day {currentDay}</h2>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {getCurrentPhase().phase}
          </div>
        </div>
        <h3 className="text-xl mb-2">{workoutProgram[currentDay].name}</h3>
        <p className="text-blue-100 text-sm mb-4">
          <strong>Warm-up:</strong> {workoutProgram[currentDay].warmup}
        </p>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            Progress: {getCompletionStats().completed}/{getCompletionStats().total} exercises
          </div>
          <button 
            onClick={resetWorkout}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-orange-500" size={24} />
              <div>
                <h3 className="font-semibold text-orange-700">Rest Time</h3>
                <p className="text-orange-600 text-sm">Take a break between sets</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-orange-700">
                {formatTime(restTime)}
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={pauseTimer}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg"
                >
                  {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button 
                  onClick={resetTimer}
                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {workoutProgram[currentDay].exercises.map((exercise: any, exerciseIndex: number) => {
          const isCurrentExercise = exerciseIndex === currentExercise;
          const allSetsCompleted = Array.from({length: exercise.sets}).every((_: any, setIndex: number) => 
            isSetCompleted(exerciseIndex, setIndex)
          );

          return (
            <div 
              key={exerciseIndex}
              className={`border rounded-lg p-4 transition-all ${
                isCurrentExercise ? 'border-blue-500 bg-blue-50' : 
                allSetsCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    allSetsCompleted ? 'bg-green-500 text-white' :
                    isCurrentExercise ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {allSetsCompleted ? <CheckCircle2 size={16} /> : exerciseIndex + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{exercise.name}</h3>
                    <p className="text-gray-600 text-sm">{exercise.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {exercise.name !== "Plank Hold" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Weight:</span>
                      <button
                        onClick={() => updateWeight(exerciseIndex, Math.max(0, (parseFloat(getWeight(exerciseIndex)) || 0) - 1.25))}
                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        value={getWeight(exerciseIndex)}
                        onChange={(e) => updateWeight(exerciseIndex, e.target.value)}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                        placeholder="0"
                        step="1.25"
                      />
                      <span className="text-sm text-gray-500">kg</span>
                      <button
                        onClick={() => updateWeight(exerciseIndex, (parseFloat(getWeight(exerciseIndex)) || 0) + 1.25)}
                        className="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-lg flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exerciseIndex ? null : exerciseIndex)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg flex items-center gap-1"
                  >
                    <Info size={16} />
                    {expandedExercise === exerciseIndex ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Exercise Instructions */}
              {expandedExercise === exerciseIndex && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">How to perform {exercise.name}:</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-blue-700">Setup: </span>
                      <span className="text-gray-700">{exercise.instructions.setup}</span>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-blue-700">Execution: </span>
                      <span className="text-gray-700">{exercise.instructions.execution}</span>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-blue-700">Breathing: </span>
                      <span className="text-gray-700">{exercise.instructions.breathing}</span>
                    </div>
                    
                    <div>
                      <span className="font-semibold text-blue-700">Tips: </span>
                      <span className="text-gray-700">{exercise.instructions.tips}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                {Array.from({length: exercise.sets}).map((_: any, setIndex: number) => {
                  const isCurrentSet = exerciseIndex === currentExercise && setIndex === currentSet;
                  const isCompleted = isSetCompleted(exerciseIndex, setIndex);
                  
                  return (
                    <div
                      key={setIndex}
                      className={`border rounded-lg p-3 text-center transition-all ${
                        isCompleted ? 'border-green-500 bg-green-100' :
                        isCurrentSet ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">
                        Set {setIndex + 1}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {exercise.reps}
                      </div>
                      {isCurrentSet && !isCompleted && (
                        <button
                          onClick={completeSet}
                          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm w-full"
                        >
                          Complete Set
                        </button>
                      )}
                      {isCompleted && (
                        <div className="mt-2 text-green-600 text-sm flex items-center justify-center gap-1">
                          <CheckCircle2 size={16} /> Done
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {exercise.isCircuit && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-700">
                  <strong>Circuit:</strong> Complete all 6 exercises back-to-back, then rest 2-3 minutes
                </div>
              )}

              {exercise.rest > 0 && !exercise.isCircuit && (
                <div className="text-sm text-gray-600">
                  Rest: {exercise.rest} seconds between sets
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Selection */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Switch Workout Day</h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(day => (
            <button
              key={day}
              onClick={() => {
                setCurrentDay(day);
                resetWorkout();
              }}
              className={`p-3 rounded-lg border text-center transition-all ${
                currentDay === day ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold">Day {day}</div>
              <div className="text-sm text-gray-600">{(workoutProgram as any)[day].name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProgressView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
        <p>Track your strength gains and workout consistency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" size={24} />
            <div>
              <div className="text-2xl font-bold text-blue-700">{currentWeek}</div>
              <div className="text-sm text-blue-600">Current Week</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-purple-500" size={24} />
            <div>
              <div className="text-2xl font-bold text-purple-700">{getCurrentPhase().phase}</div>
              <div className="text-sm text-purple-600">Training Phase</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-green-500" size={24} />
            <div>
              <div className="text-2xl font-bold text-green-700">{Object.keys(exerciseWeights).length}</div>
              <div className="text-sm text-green-600">Tracked Weights</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="text-orange-500" size={24} />
            <div>
              <div className="text-2xl font-bold text-orange-700">{Object.keys(completedSets).length}</div>
              <div className="text-sm text-orange-600">Sets Completed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Week Progression</h3>
        <div className="space-y-3">
          {Array.from({length: 12}).map((_: any, weekIndex: number) => {
            const week = weekIndex + 1;
            const isCurrentWeek = week === currentWeek;
            const isCompleted = week < currentWeek;
            
            return (
              <div key={week} className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentWeek(week)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isCurrentWeek ? 'bg-blue-500 text-white' :
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : week}
                </button>
                <div className="flex-1">
                  <div className={`font-semibold ${isCurrentWeek ? 'text-blue-700' : ''}`}>
                    Week {week}
                  </div>
                  <div className="text-sm text-gray-600">
                    {week <= 2 ? 'Foundation Phase' : 
                     week <= 6 ? 'Building Phase' : 'Strength Phase'}
                  </div>
                </div>
                {isCurrentWeek && (
                  <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Current Phase Goals</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="font-semibold text-lg text-gray-800 mb-2">
            {getCurrentPhase().phase}
          </div>
          <p className="text-gray-700">{getCurrentPhase().focus}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-4 px-6 text-center font-semibold rounded-l-lg transition-all ${
              activeTab === 'workout' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Dumbbell size={20} />
              Workout
            </div>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-4 px-6 text-center font-semibold rounded-r-lg transition-all ${
              activeTab === 'progress' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={20} />
              Progress
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'workout' ? renderWorkoutView() : renderProgressView()}
    </div>
  );
};

export default WeightliftingApp; 