/* eslint-disable no-param-reassign */
const Topic = require('../models/Topic');
const Theory = require('../models/Theory');
const Exercise = require('../models/Exercise');
const TheoryDone = require('../models/TheoryDone');
const ExerciseDone = require('../models/ExerciseDone');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

class TopicsController {
  async getTopicsData(topicId, userId) {
    const topic = await Topic.findByPk(topicId, {
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
    });
    if (!topic) throw new NotFoundError('Topic not found');

    const {
      id, chapterId, name, exercises, theory,
    } = topic;

    const result = {
      id,
      chapterId,
      name,
      activities: [theory, ...exercises],
    };

    return result;
  }

  async findTopicById(topicId) {
    const topic = await Topic.findByPk(topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    return topic;
  }

  getAllTopics(queryConfig, chapterId = null) {
    if (chapterId) {
      return Topic.findAll({ where: { chapterId }, ...queryConfig });
    } return Topic.findAll(queryConfig);
  }

  async createTopic(topicParams) {
    const { name } = topicParams;
    const topic = await Topic.findOne({ where: { name } });
    if (topic) throw new ConflictError('Topic already exists');

    const createdTopic = await Topic.create(topicParams);
    return createdTopic;
  }

  async editTopic(topicParams) {
    const {
      id, name,
    } = topicParams;
    const topic = await Topic.findByPk(id);
    if (!topic) throw new NotFoundError('Topic not found');

    if (name) topic.name = name;

    await topic.save();
    return topic;
  }

  async destroyTopic(topicId) {
    const topic = await Topic.findByPk(topicId);
    if (!topic) throw new NotFoundError('Topic not found');

    const exercises = await Exercise.findAll({ where: { topicId } });

    const theory = await Theory.findOne({ where: { topicId } });

    const exercisesId = exercises.map((exercise) => exercise.id);

    if (exercises) {
      await ExerciseDone.destroy({ where: { exerciseId: exercisesId } });
    }
    if (theory) {
      await TheoryDone.destroy({ where: { theoryId: theory.id } });
    }
    await Exercise.destroy({ where: { topicId } });
    await Theory.destroy({ where: { topicId } });

    await Topic.destroy({ where: { id: topicId } });
  }
}

module.exports = new TopicsController();
