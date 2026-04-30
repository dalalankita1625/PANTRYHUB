import express, { Response } from 'express';
import Order from '../models/Order';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Place a new order
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, totalPrice, deliveryFee, ecoDelivery, deliverySlot, paymentMethod, address } = req.body;

    const order = new Order({
      userId: req.user.id,
      items,
      totalPrice,
      deliveryFee,
      ecoDelivery,
      deliverySlot,
      paymentMethod,
      address,
      status: 'confirmed',
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

// Get all orders for logged-in user
router.get('/my-orders', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

// Get single order by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    // Ensure user owns the order
    if (order.userId.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    res.json(order);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

export default router;
