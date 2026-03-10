package com.fittrack.backend.service;

import com.fittrack.backend.dto.WorkoutRequest;
import com.fittrack.backend.dto.WorkoutResponse;
import com.fittrack.backend.entity.Exercise;
import com.fittrack.backend.entity.Workout;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.repository.WorkoutRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;

    public WorkoutService(WorkoutRepository workoutRepository, UserRepository userRepository) {
        this.workoutRepository = workoutRepository;
        this.userRepository = userRepository;
    }

    public Workout createWorkout(WorkoutRequest request, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Workout workout = new Workout();
        workout.setName(request.getName());
        workout.setDescription(request.getDescription());
        workout.setUser(user);

        if (request.getExercises() != null) {
            List<Exercise> exercises = request.getExercises().stream()
                    .map(e -> {
                        Exercise exercise = new Exercise();
                        exercise.setName(e.getName());
                        exercise.setSets(e.getSets());
                        exercise.setReps(e.getReps());
                        exercise.setWeight(e.getWeight());
                        exercise.setWorkout(workout);
                        return exercise;
                    }).collect(Collectors.toList());
            workout.setExercises(exercises);
        }

        return workoutRepository.save(workout);
    }

    public List<Workout> getWorkouts(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return workoutRepository.findByUserId(user.getId());
    }

    public void deleteWorkout(Long id, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this workout");
        }

        workoutRepository.deleteById(id);
    }

    public WorkoutResponse updateWorkout(Long id, WorkoutRequest request, String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Workout workout = workoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout not found"));

        if (!workout.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to update this workout");
        }


        workout.setName(request.getName());
        workout.setDescription(request.getDescription());

        if (request.getExercises() != null) {
            List<Exercise> exercises = request.getExercises().stream()
                    .map(e -> {
                        Exercise exercise = new Exercise();
                        exercise.setName(e.getName());
                        exercise.setSets(e.getSets());
                        exercise.setReps(e.getReps());
                        exercise.setWeight(e.getWeight());
                        exercise.setWorkout(workout);
                        return exercise;
                    }).collect(Collectors.toList());
            workout.getExercises().clear();
            workout.getExercises().addAll(exercises);
        }

        return WorkoutResponse.from(workoutRepository.save(workout));
    }
}