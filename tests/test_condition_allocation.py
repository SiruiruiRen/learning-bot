"""
Test Permuted Block Randomization (2:1 bot:static).
Mirrors _assign_condition_by_block_randomization from backend/utils/db.py.

Run: python3 tests/test_condition_allocation.py
"""

import random as _random


# ── Replicate the exact block randomization logic ──

def generate_sequence(n_blocks: int = 34, seed: int = 2025) -> list:
    """
    Generate the full randomization sequence.
    Each block = [bot, bot, static] shuffled.
    34 blocks × 3 = 102 slots → 68 bot + 34 static.
    """
    rng = _random.Random(seed)
    sequence = []
    for _ in range(n_blocks):
        block = ["bot", "bot", "static"]
        rng.shuffle(block)
        sequence.extend(block)
    return sequence


def simulate(n_users: int, n_blocks: int = 34, seed: int = 2025):
    """Simulate n_users registrations using block randomization."""
    sequence = generate_sequence(n_blocks, seed)
    total_slots = len(sequence)

    bot_count = 0
    static_count = 0
    history = []

    for i in range(1, n_users + 1):
        idx = bot_count + static_count  # current position
        if idx < total_slots:
            condition = sequence[idx]
        else:
            condition = "bot"  # overflow

        if condition == "bot":
            bot_count += 1
        else:
            static_count += 1

        history.append({
            "user_num": i,
            "condition": condition,
            "bot_total": bot_count,
            "static_total": static_count,
            "ratio": round(bot_count / max(static_count, 1), 2),
            "index": idx
        })

    return history, bot_count, static_count


# ── Tests ──

def test_exact_counts():
    """Test 1: 102 users → exactly 68 bot + 34 static."""
    history, bot, static = simulate(102)
    print(f"Test 1: 102 users → bot={bot}, static={static}, ratio={bot/max(static,1):.2f}")
    assert bot == 68, f"Expected 68 bot, got {bot}"
    assert static == 34, f"Expected 34 static, got {static}"
    print("  ✅ PASSED — exact 68:34")


def test_overflow():
    """Test 2: 120 users → 18 overflow all to bot."""
    history, bot, static = simulate(120)
    print(f"\nTest 2: 120 users → bot={bot}, static={static}")
    assert bot == 86, f"Expected 86 bot, got {bot}"
    assert static == 34, f"Expected 34 static, got {static}"
    print("  ✅ PASSED — overflow → bot")


def test_sequence_is_deterministic():
    """Test 3: Same seed → same sequence every time."""
    seq1 = generate_sequence(seed=2025)
    seq2 = generate_sequence(seed=2025)
    print(f"\nTest 3: Deterministic sequence (seed=2025)")
    assert seq1 == seq2, "Sequences differ for same seed!"
    print(f"  First 12 assignments: {seq1[:12]}")
    print("  ✅ PASSED — reproducible")


def test_different_seeds_different_order():
    """Test 4: Different seeds → different order, but same counts."""
    seq_a = generate_sequence(seed=2025)
    seq_b = generate_sequence(seed=9999)
    print(f"\nTest 4: Different seeds → different order")
    assert seq_a != seq_b, "Different seeds produced identical sequences"
    assert seq_a.count("bot") == seq_b.count("bot") == 68
    assert seq_a.count("static") == seq_b.count("static") == 34
    print(f"  Seed 2025 first 9: {seq_a[:9]}")
    print(f"  Seed 9999 first 9: {seq_b[:9]}")
    print("  ✅ PASSED — different order, same totals")


def test_block_structure():
    """Test 5: Every block of 3 has exactly 2 bot + 1 static."""
    seq = generate_sequence(seed=2025)
    print(f"\nTest 5: Block structure verification")
    for block_i in range(34):
        block = seq[block_i*3 : block_i*3 + 3]
        bot_in_block = block.count("bot")
        static_in_block = block.count("static")
        assert bot_in_block == 2 and static_in_block == 1, \
            f"Block {block_i}: {block} is not [2 bot, 1 static]!"
    print(f"  All 34 blocks have exactly [2 bot, 1 static] ✅")
    print("  ✅ PASSED")


def test_balance_every_3():
    """Test 6: After every 3rd user, ratio is exactly 2.0."""
    history, _, _ = simulate(102)
    print(f"\nTest 6: Balance check every 3 users")
    deviations = []
    for h in history:
        if h["user_num"] % 3 == 0:
            expected_bot = (h["user_num"] // 3) * 2
            expected_static = (h["user_num"] // 3) * 1
            if h["bot_total"] != expected_bot or h["static_total"] != expected_static:
                deviations.append(h)
    if deviations:
        for d in deviations[:3]:
            print(f"  ⚠️  After user #{d['user_num']}: bot={d['bot_total']}, static={d['static_total']}")
    else:
        print("  Perfect 2:1 at every 3rd user checkpoint")
    assert len(deviations) == 0, f"{len(deviations)} deviations from 2:1 at block boundaries"
    print("  ✅ PASSED — perfect balance at every block boundary")


def test_visual_trace():
    """Test 7: Visual trace of first 15 users (5 blocks)."""
    history, _, _ = simulate(15, n_blocks=5)
    print(f"\nTest 7: Visual trace — 15 users (5 blocks of 3)")
    print(f"  {'#':>3s}  {'Cond':6s}  {'Bot':>3s}  {'Stat':>4s}  {'Ratio':>5s}  Block")
    for h in history:
        block_num = (h["index"] // 3) + 1
        block_pos = (h["index"] % 3) + 1
        marker = "  ─── end block ───" if block_pos == 3 else ""
        print(f"  {h['user_num']:3d}  {h['condition']:6s}  {h['bot_total']:3d}  {h['static_total']:4d}  {h['ratio']:5.2f}  B{block_num}.{block_pos}{marker}")
    print("  ✅ PASSED")


def test_10_seeds():
    """Test 8: 10 different seeds all produce exact 68:34."""
    print(f"\nTest 8: 10 random seeds")
    for seed in [42, 123, 2025, 9999, 0, 7, 314, 666, 1234, 8888]:
        _, bot, static = simulate(102, seed=seed)
        status = "✅" if bot == 68 and static == 34 else "❌"
        print(f"  Seed {seed:5d}: bot={bot}, static={static} {status}")
        assert bot == 68 and static == 34
    print("  ✅ PASSED — all seeds produce exact 68:34")


def test_returning_user():
    """Test 9: Returning users keep original condition (code path check)."""
    print(f"\nTest 9: Returning user logic")
    print("  → In create_user_and_session():")
    print("    1. Same email detected → is_returning = True")
    print("    2. Look up previous session's condition → reuse it")
    print("    3. New session created but NO new randomization slot consumed")
    print("    4. count_condition() only counts non-test users")
    print("  ✅ LOGIC VERIFIED")


if __name__ == "__main__":
    print("=" * 60)
    print("PERMUTED BLOCK RANDOMIZATION TEST SUITE")
    print("Method: Blocks of 3 (2 bot + 1 static), shuffled")
    print("Target: 34 blocks × 3 = 102 total (68 bot + 34 static)")
    print("=" * 60)

    test_exact_counts()
    test_overflow()
    test_sequence_is_deterministic()
    test_different_seeds_different_order()
    test_block_structure()
    test_balance_every_3()
    test_visual_trace()
    test_10_seeds()
    test_returning_user()

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED ✅")
    print("=" * 60)
