import { Router, Request, Response } from 'express';
import { Goal, IGoal } from '../models/goal.model';

const router = Router();

// Helper to get status from percentage
function getStatusFromPercentage(percentage: number): string {
  if (percentage >= 100) return 'COMPLETED';
  if (percentage >= 75) return 'ALMOST_DONE';
  if (percentage >= 50) return 'HALFWAY';
  if (percentage > 0) return 'IN_PROGRESS';
  return 'NOT_STARTED';
}

// Helper to create default milestones
function createDefaultMilestones() {
  return [
    { name: 'Getting Started', targetPercentage: 25, reached: false },
    { name: 'Halfway There', targetPercentage: 50, reached: false },
    { name: 'Almost Done', targetPercentage: 75, reached: false },
    { name: 'Goal Complete!', targetPercentage: 100, reached: false }
  ];
}

// Helper to update milestones based on percentage
function updateMilestones(milestones: any[], percentage: number) {
  return milestones.map(m => {
    if (!m.reached && percentage >= m.targetPercentage) {
      return { ...m, reached: true, reachedAt: new Date() };
    }
    if (m.reached && percentage < m.targetPercentage) {
      return { ...m, reached: false, reachedAt: undefined };
    }
    return m;
  });
}

// GET /api/goals - Get all goals (or create default if none exist)
router.get('/', async (req: Request, res: Response) => {
  try {
    let goals = await Goal.find().sort({ updatedAt: -1 });
    
    // Create default goal if none exists
    if (goals.length === 0) {
      const defaultGoal = new Goal({
        title: 'Daily Progress Goal',
        description: 'Track your daily progress towards completion',
        targetValue: 100,
        currentValue: 0,
        status: 'NOT_STARTED',
        milestones: createDefaultMilestones(),
        history: []
      });
      await defaultGoal.save();
      goals = [defaultGoal];
    }
    
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// GET /api/goals/:id - Get single goal
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// POST /api/goals - Create new goal
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, targetValue } = req.body;
    const goal = new Goal({
      title: title || 'New Goal',
      description,
      targetValue: targetValue || 100,
      currentValue: 0,
      status: 'NOT_STARTED',
      milestones: createDefaultMilestones(),
      history: []
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id/progress - Set progress value
router.put('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const clampedValue = Math.max(0, Math.min(value, goal.targetValue));
    const percentage = (clampedValue / goal.targetValue) * 100;

    goal.currentValue = clampedValue;
    goal.status = getStatusFromPercentage(percentage);
    goal.milestones = updateMilestones(goal.milestones, percentage) as any;
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// POST /api/goals/:id/add-progress - Add incremental progress
router.post('/:id/add-progress', async (req: Request, res: Response) => {
  try {
    const { value, note } = req.body;
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const newValue = Math.min(goal.currentValue + value, goal.targetValue);
    const percentage = (newValue / goal.targetValue) * 100;

    // Add to history
    goal.history.push({
      value,
      timestamp: new Date(),
      note
    });

    goal.currentValue = newValue;
    goal.status = getStatusFromPercentage(percentage);
    goal.milestones = updateMilestones(goal.milestones, percentage) as any;
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add progress' });
  }
});

// POST /api/goals/:id/reset - Reset goal progress
router.post('/:id/reset', async (req: Request, res: Response) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goal.currentValue = 0;
    goal.status = 'NOT_STARTED';
    goal.milestones = createDefaultMilestones() as any;
    goal.history = [];
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset goal' });
  }
});

// GET /api/goals/:id/history - Get goal history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal.history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
