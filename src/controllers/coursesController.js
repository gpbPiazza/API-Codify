/* eslint-disable no-param-reassign */

const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const NotFoundError = require('../errors/NotFoundError');
const chaptersController = require('./chaptersController');
const CourseUser = require('../models/CourseUser');
const ConflictError = require('../errors/ConflictError');
const User = require('../models/User');
const ExerciseDone = require('../models/ExerciseDone');

class CoursesController {
  async findCourseById(courseId) {
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
    if (!courseData) throw new NotFoundError();
    return courseData;
  }

  getAllCourses(queryConfig) {
    return Course.findAll(queryConfig);
  }

  async createCourse(courseParams) {
    const { name } = courseParams;
    const course = await Course.findOne({ where: { name } });
    if (course) throw new ConflictError('Course already exists');

    const createdCourse = await Course.create(courseParams);
    return createdCourse;
  }

  async editCourse(courseParams) {
    const {
      id, name, description, photo,
    } = courseParams;
    const course = await Course.findByPk(id);
    if (!course) throw new NotFoundError('Course not found');

    if (name) course.name = name;
    if (description) course.description = description;
    if (photo) course.photo = photo;

    await course.save();
    return course;
  }

  async destroyCourse(courseId) {
    const course = await Course.findByPk(courseId);
    if (!course) throw new NotFoundError('Chapter not found');

    const chapters = await Chapter.findAll({ where: { courseId } });
    const promises = chapters.map((chapter) => chaptersController.destroyChapter(chapter.id));
    await Promise.all(promises);
  }

  async startCourse({ userId, courseId }) {
    const thisUserAlredyStartedCourse = await CourseUser.findOne({ where: { courseId, userId } });
    if (thisUserAlredyStartedCourse) throw new ConflictError();

    await CourseUser.create({ userId, courseId });
  }

  async getAllCoursesStarted(userId) {
    const userWithCourses = await User.findByPk(
      userId, {
        include: [{
          model: Course,
          attributes: ['id', 'name', 'description', 'photo'],
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
        }],
      },
    );

    const { courses } = userWithCourses;

    const arrayObjects = courses.map((course) => {
      const theoryIdList = [];
      const exerciseIdList = [];
      course.chapters.forEach((chapter) => {
        if (!chapter) throw new NotFoundError();
        chapter.topics.forEach((topic) => {
          if (!topic || !topic.theory || !topic.exercises) throw new NotFoundError();

          theoryIdList.push(topic.theory.id);

          topic.exercises.forEach((exercise) => {
            exerciseIdList.push(exercise.id);
          });
        });
      });
      // const exercisesDone = await this._getExercisesDone(userId, exerciseIdList);
      // const theoriesDone = await this._getTheoriesDone(userId, theoryIdList);
    });

    console.log(arrayObjects);

    return courses;
  }

  async getAllCoursesNotStarted(userId) {
    const coursesStarted = await this.getAllCoursesStarted(userId);
    const allCourses = await this.getAllCourses();

    const courses = allCourses.filter((el) => !coursesStarted.some((f) => f.id === el.id));

    return courses;
  }
}

module.exports = new CoursesController();
