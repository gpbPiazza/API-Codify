/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const TheoryDone = require('../models/TheoryDone');
const ExerciseDone = require('../models/ExerciseDone');
const NotFoundError = require('../errors/NotFoundError');

class UsersController {
  async create(userData) {
    userData.password = bcrypt.hashSync(userData.password, 10);

    const user = await User.create(userData);
    return user;
  }

  async getUserProgress(userId, courseId) {
    const courseData = await Course.findByPk(
      courseId, {
        include: {
          model: Chapter,
          attributes: ['id', 'name'],
          include: {
            model: Topic,
            attributes: ['id', 'name'],
            include: [
              {
                model: Theory,
                attributes: ['id', 'youtubeLink'],
              },
              {
                model: Exercise,
                attributes: ['id'],
              },
            ],
          },
        },
      },
    );

    const theoryIdList = [];
    const exerciseIdList = [];

    courseData.chapters.forEach((chapter) => {
      if (!chapter) throw new NotFoundError();
      chapter.topics.forEach((topic) => {
        if (!topic || !topic.theory || !topic.exercises) throw new NotFoundError();

        theoryIdList.push(topic.theory.id);

        topic.exercises.forEach((exercise) => {
          exerciseIdList.push(exercise.id);
        });
      });
    });

    const exercisesDone = await this._getExercisesDone(userId, exerciseIdList);
    const theoriesDone = await this._getTheoriesDone(userId, theoryIdList);

    console.log(exercisesDone);

    const allCourseTasks = [...theoryIdList, ...exerciseIdList];
    const allTasksDone = [...exercisesDone, ...theoriesDone];

    const progress = Math.round((allTasksDone.length / allCourseTasks.length) * 100);

    return { progress };
  }

  async getTopicsProgressByChapter(userId, chapterId) {
    const chapter = await Chapter.findByPk(chapterId, {
      include: [
        {
          model: Topic,
          include: [
            {
              model: Theory,
              include: {
                model: TheoryDone,
                where: { userId },
                required: false,
              },
            },
            {
              model: Exercise,
              include: {
                model: ExerciseDone,
                where: { userId },
                required: false,
              },
            },
          ],
        },
      ],
    });

    const progressList = [];
    const { topics } = chapter;

    topics.forEach((topic) => {
      let topicProgress = false;
      if (topic.theory.theoryDones.length !== 0) {
        topic.exercises.forEach((exercise) => {
          if (exercise.exerciseDones.length !== 0) {
            topicProgress = true;
          } else {
            topicProgress = false;
          }
        });
      }

      progressList.push(topicProgress);
    });

    return progressList;
  }

  async _getExercisesDone(userId, exerciseIdList) {
    const allUserExercisesDoneId = await ExerciseDone.findAll({ where: { userId }, order: '"updatedAt" DESC' });
    const exercisesDone = allUserExercisesDoneId.filter((exercise) => exerciseIdList.find((id) => exercise.exerciseId === id));

    return exercisesDone;
  }

  async _getTheoriesDone(userId, theoryIdList) {
    const allUserTheoriesDoneId = await TheoryDone.findAll({ where: { userId }, order: '"updatedAt" DESC' });
    const theoriesDone = allUserTheoriesDoneId.filter((exercise) => theoryIdList.find((id) => exercise.theoryId === id));

    return theoriesDone;
  }
}

module.exports = new UsersController();
