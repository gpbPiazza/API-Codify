const router = require('express').Router();

const authenticationMiddleware = require('../middlewares/authenticationMiddleware');
const coursesController = require('../controllers/coursesController');
const topicsController = require('../controllers/topicsController');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const cleanCourses = require('../utils/cleanCourses');

router.get('/:id', authenticationMiddleware, async (req, res) => {
  const courseId = +req.params.id;

  try {
    const course = await coursesController.findCourseById(courseId);

    return res.status(200).send(course);
  } catch (exception) {
    if (exception instanceof NotFoundError) return res.status(404).send({ error: 'Course not found' });
    return res.sendStatus(500);
  }
});

router.get('/', authenticationMiddleware, async (req, res) => {
  try {
    const courses = await coursesController.getAllCourses();

    return res.status(200).send(courses);
  } catch {
    return res.sendStatus(500);
  }
});

router.post('/start', authenticationMiddleware, async (req, res) => {
  const { userId } = req;
  const { courseId } = req.body;

  try {
    const course = await coursesController.findCourseById(courseId);
    await coursesController.startCourse({ userId, courseId });

    return res.status(201).send({ ...course.dataValues, userId });
  } catch (exception) {
    if (exception instanceof ConflictError) return res.status(409).send({ error: 'This user has already started this course' });

    if (exception instanceof NotFoundError) return res.status(404).send({ error: 'Course not found' });

    return res.sendStatus(500);
  }
});

router.get('/users/started', authenticationMiddleware, async (req, res) => {
  const { userId } = req;
  try {
    const courses = await coursesController.getAllCoursesStarted(userId);

    const cleanedCourses = cleanCourses(courses);

    return res.status(200).send(cleanedCourses);
  } catch (e) {
    console.log(e);
    if (e instanceof NotFoundError) return res.status(404).send({ messager: 'chapter or exercises not found' });
    return res.sendStatus(500);
  }
});

router.get('/users/not-started', authenticationMiddleware, async (req, res) => {
  const { userId } = req;
  try {
    const courses = await coursesController.getAllCoursesNotStarted(userId);

    const cleanedCourses = cleanCourses(courses);

    return res.status(200).send(cleanedCourses);
  } catch (e) {
    return res.sendStatus(500);
  }
});

router.get('/last-seen', authenticationMiddleware, async (req, res) => {
  const { userId } = req;
  try {
    const course = await coursesController.getLastCourseSeen(userId);

    return res.status(200).send(course);
  } catch (e) {
    return res.sendStatus(500);
  }
});

router.get('/:id/chapters/:chapterId/topics/:topicId', authenticationMiddleware, async (req, res) => {
  const { topicId } = req.params;
  const { userId } = req;
  const id = parseInt(topicId);
  const result = await topicsController.getTopicsData(id, userId);
  return res.send(result);
});

module.exports = router;
