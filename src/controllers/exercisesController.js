/* eslint-disable no-param-reassign */
const Exercise = require('../models/Exercise');
const NotFoundError = require('../errors/NotFoundError');

class ExercisesController {
  async findExerciseById(exerciseId) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) throw new NotFoundError('Exercise not found');

    return exercise;
  }

  getAllExercises(queryConfig, topicId = null) {
    if (topicId) {
      return Exercise.findAll({ where: { topicId }, ...queryConfig });
    }
    return Exercise.findAll(queryConfig);
  }

  async createExercise(exerciseParams) {
    const createdExercise = await Exercise.create(exerciseParams);
    return createdExercise;
  }

  async editExercise(exerciseParams) {
    const {
      id, name,
    } = exerciseParams;
    const exercise = await Exercise.findByPk(id);
    if (!exercise) throw new NotFoundError('Exercise not found');

    if (name) exercise.name = name;

    await exercise.save();
    return exercise;
  }

  async destroyExercise(exerciseId) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) throw new NotFoundError('Exercise not found');

    await Exercise.destroy({ where: { id: exerciseId } });
  }
}

module.exports = new ExercisesController();
