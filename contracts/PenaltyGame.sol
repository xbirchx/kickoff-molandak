// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEntropyV2 {
    function requestV2() external payable returns (uint64 sequenceNumber);
    function getFeeV2() external view returns (uint256 fee);
}

abstract contract IEntropyConsumer {
    function _entropyCallback(
        uint64 sequenceNumber,
        address provider,
        bytes32 randomNumber
    ) external {
        address entropy = getEntropy();
        require(msg.sender == entropy, "Only entropy can call");
        entropyCallback(sequenceNumber, provider, randomNumber);
    }

    function entropyCallback(
        uint64 sequenceNumber,
        address provider,
        bytes32 randomNumber
    ) internal virtual;

    function getEntropy() internal view virtual returns (address);
}

contract PenaltyGame is IEntropyConsumer {
    IEntropyV2 public entropy;
    address public owner;

    // Fixed bet amounts (in wei)
    uint256 public constant BET_SMALL = 0.01 ether;   // 0.01 MON
    uint256 public constant BET_MEDIUM = 0.05 ether;  // 0.05 MON
    uint256 public constant BET_LARGE = 0.1 ether;    // 0.1 MON

    // Payout multiplier (5x)
    uint256 public constant PAYOUT_MULTIPLIER = 5;

    // Number of positions (0-4: far-left, left, center, right, far-right)
    uint256 public constant NUM_POSITIONS = 5;

    struct Game {
        address player;
        uint256 betAmount;
        uint8 chosenPosition;  // 0-4
        bool resolved;
        bool won;
        uint8 ballPosition;    // Where the ball actually went
    }

    // Maps sequence number to game data
    mapping(uint64 => Game) public games;

    // Player statistics
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    mapping(address => uint256) public playerTotalWon;

    // Events
    event GameStarted(
        uint64 indexed sequenceNumber,
        address indexed player,
        uint256 betAmount,
        uint8 chosenPosition
    );

    event GameResolved(
        uint64 indexed sequenceNumber,
        address indexed player,
        bool won,
        uint8 chosenPosition,
        uint8 ballPosition,
        uint256 payout
    );

    event FundsDeposited(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier validPosition(uint8 position) {
        require(position < NUM_POSITIONS, "Invalid position");
        _;
    }

    modifier validBetAmount(uint256 amount) {
        require(
            amount == BET_SMALL ||
            amount == BET_MEDIUM ||
            amount == BET_LARGE,
            "Invalid bet amount"
        );
        _;
    }

    constructor(address entropyAddress) {
        entropy = IEntropyV2(entropyAddress);
        owner = msg.sender;
    }

    // Main game function
    function placeBet(uint8 position)
        external
        payable
        validPosition(position)
    {
        uint256 entropyFee = getEntropyFee();
        require(msg.value > entropyFee, "Must send bet amount + entropy fee");

        uint256 betAmount = msg.value - entropyFee;
        require(
            betAmount == BET_SMALL ||
            betAmount == BET_MEDIUM ||
            betAmount == BET_LARGE,
            "Invalid bet amount"
        );

        // Ensure contract can pay out if player wins
        uint256 potentialPayout = betAmount * PAYOUT_MULTIPLIER;
        require(
            address(this).balance >= potentialPayout,
            "Insufficient contract balance for potential payout"
        );

        // Request random number
        uint64 sequenceNumber = entropy.requestV2{value: entropyFee}();

        // Store game data
        games[sequenceNumber] = Game({
            player: msg.sender,
            betAmount: betAmount,
            chosenPosition: position,
            resolved: false,
            won: false,
            ballPosition: 0
        });

        emit GameStarted(sequenceNumber, msg.sender, betAmount, position);
    }

    // Entropy callback - determines game outcome
    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomNumber
    ) internal override {
        Game storage game = games[sequenceNumber];
        require(game.player != address(0), "Game not found");
        require(!game.resolved, "Game already resolved");

        // Determine ball position (0-4)
        uint8 ballPosition = uint8(uint256(randomNumber) % NUM_POSITIONS);

        game.ballPosition = ballPosition;
        game.resolved = true;

        uint256 payout = 0;

        if (game.chosenPosition == ballPosition) {
            // Player saved! (won)
            game.won = true;
            payout = game.betAmount * PAYOUT_MULTIPLIER;
            playerWins[game.player]++;
            playerTotalWon[game.player] += payout;

            // Transfer winnings
            (bool success, ) = payable(game.player).call{value: payout}("");
            require(success, "Payout failed");
        } else {
            // Goal! (lost)
            playerLosses[game.player]++;
        }

        emit GameResolved(
            sequenceNumber,
            game.player,
            game.won,
            game.chosenPosition,
            ballPosition,
            payout
        );
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    function getEntropyFee() public view returns (uint256) {
        return entropy.getFeeV2();
    }

    // Calculate total cost for a bet (bet amount + entropy fee)
    function getTotalCost(uint256 betAmount) external view returns (uint256) {
        return betAmount + getEntropyFee();
    }

    // Get game details
    function getGame(uint64 sequenceNumber) external view returns (
        address player,
        uint256 betAmount,
        uint8 chosenPosition,
        bool resolved,
        bool won,
        uint8 ballPosition
    ) {
        Game memory game = games[sequenceNumber];
        return (
            game.player,
            game.betAmount,
            game.chosenPosition,
            game.resolved,
            game.won,
            game.ballPosition
        );
    }

    // Get player stats
    function getPlayerStats(address player) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 totalWon
    ) {
        return (
            playerWins[player],
            playerLosses[player],
            playerTotalWon[player]
        );
    }

    // Owner functions for liquidity management
    function depositFunds() external payable onlyOwner {
        emit FundsDeposited(msg.sender, msg.value);
    }

    function withdrawFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(owner, amount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
