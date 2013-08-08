function shuffle(array) {
    var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

$(document).ready(function(){
        var neighbors = [{x: 0, y: -1}, {x: 1, y: -1}, 
            {x: 1, y: 0}, {x: 0, y: 1}, 
            {x: -1, y: 1}, {x: -1, y: 0}];
    var NORTH_WEST = 0,
        NORTH_EAST = 1,
        EAST = 2,
        SOUTH_EAST = 3,
        SOUTH_WEST = 4,
        WEST = 5;

    var DIRECTIONS_COUNT = 6;

    function getNext(pos, radius, direction) {
        return {x: pos.x + neighbors[direction].x,
                y: pos.y + neighbors[direction].y};
    }

    function getNextClockwise(pos, radius) {
        if (pos.x == 0 && pos.y == 0) { 
            return pos;
        }

        return getNext(pos, radius, getNextClockwiseDirection(pos, radius));
    }

    function getNextClockwiseDirection(pos, radius) {
        if (pos.x == radius) {
            // north-east side

            if (pos.y == -1 * radius) {
                // north-east corner
                return SOUTH_EAST;
            }
            if (pos.y == 0) {
                // east corner
                return SOUTH_WEST;
            }

            return SOUTH_EAST;
        }
        
        if (pos.y == -1 * radius) {
            // north side (and not the north-east corner)
            return EAST;
        }
        
        if (pos.x == -1 * radius) {
            // south-west side

            if (pos.y == radius) {
                // south-west corner
                return NORTH_WEST;
            }
            if (pos.y == 0) {
                // south corner
                return NORTH_EAST;
            }

            return NORTH_WEST;
        }
        
        if (pos.y == radius) {
            // south side (and not the south-west corner)
            return WEST;
        }

        if (pos.x + pos.y == radius) {
            // south-east side, not the corners
            return SOUTH_WEST;
        }

        // north-west side, not the corners
        return NORTH_EAST;
    }

    function rotateDirectionClockwise(direction) {
       return ((direction + 1) % DIRECTIONS_COUNT); 
    }

    function getNextClockwiseInward(pos, radius) {
        if (pos.x == 0 && pos.y == 0) { 
            return pos;
        }

        return getNext(pos, 
                       radius, 
                       rotateDirectionClockwise(
                           getNextClockwiseDirection(pos, radius)
                       )
                  );
    }

    var chances = [5, 2, 6, 3, 8, 10,
                   9, 12, 11, 4, 8, 10,
                   9, 4, 5, 6, 3, 11];

    var resources = ["wood", "brick", "wheat", "sheep", "ore", "desert"];
    var resourcesMap = {wood: {idx: 0, count: 4}, brick: {idx: 1, count: 3}, 
        wheat: {idx: 2, count: 4}, sheep: {idx: 3, count: 4}, 
        ore: {idx: 4, count: 3}, desert: {idx: 5, count: 1}};
        var resourcesColors = ["green", "red", "yellow", "white", "grey", "blue"];

        function initResourceList() {
            var totalCount = 0;
            for (var res in resourcesMap) {
                var resource = resourcesMap[res];
                totalCount += resource.count;
            }
            var arr = new Array(totalCount);
            var i = 0;
            for (var res in resourcesMap) {
                var resource = resourcesMap[res];
                for (var j = 0; j < resource.count; ++j) {
                    arr[i++] = resource.idx;
                }
            }

            arr = shuffle(arr);
            return arr;
        }

        var neighbors = [{x: 0, y: -1}, {x: 1, y: -1}, 
            {x: 1, y: 0}, {x: 0, y: 1}, 
            {x: -1, y: 1}, {x: -1, y: 0}];
            var radius = 2;
            board = new Array(radius*2 + 1);
            resourceList = initResourceList();
            for (var i = 0; i < board.length; ++i) {
                board[i] = new Array(radius*2 + 1);
                for (var j = 0; j < board[i].length; ++j) {
                    if (!isLegal((i - radius), (j - radius), radius)) {
                        continue;
                    }

                    board[i][j] = {idx: -1, resource: -1, chance: -1};
                }
            }

            function isLegal(x, y, radius) {
                return (x <= radius && x >= -1 * radius && y <= radius && y >= -1 * radius && (Math.abs(x + y) <= radius));
            }

            function coords2idx(x, y, radius) {
                if (isLegal(x, y, radius)) {
                    return board[y + radius][x + radius].idx;
                }

                return -1;
            }

            function pos2hex(pos, radius) {
                if (isLegal(pos.x, pos.y, radius)) {
                    return board[pos.y + radius][pos.x + radius];
                }

                return null;
            }

            var $hexes = $(".hex-map .hex");
            var hex_idx = 0;
            for (var i = 0; i < board.length; ++i) {
                for (var j = 0; j < board[i].length; ++j) {
                    if (!isLegal((i - radius), (j - radius), radius)) {
                        continue;
                    }

                    var hex = board[i][j];
                    hex.idx = hex_idx;
                    hex.resource = resourceList[hex_idx];
                    hex_idx++;
                }
            }

            var current_radius = radius;
            var pos = {x: 0, y: (-1 * radius)};
            var chance_idx = 1;
            while (true) {
                var hex = pos2hex(pos, radius);
                if (!hex) {
                    console.log("Error! ");
                    console.log(pos);
                    console.log("radius: " + current_radius);
                }

                if (hex.chance != -1) {
                    // we hit a marked hex!

                    // check if we are done marking the whole board
                    if (pos.x == 0 && pos.y == 0) {
                        break;
                    }

                    // not done yet - advance inward.
                    pos = getNextClockwiseInward(pos, current_radius);
                    current_radius--;
                    continue;
                }

                pos = getNextClockwise(pos, current_radius);
                if (hex.resource == resourcesMap.desert.idx) { 
                    // skip the desert
                    hex.chance = 0;
                    continue;
                }

                //hex.chance = chances[chance_idx];
                hex.chance = chance_idx;
                chance_idx++;
            }

            for (var i = 0; i < board.length; ++i) {
                for (var j = 0; j < board[i].length; ++j) {
                    if (!isLegal((i - radius), (j - radius), radius)) {
                        continue;
                    }

                    var hex = board[i][j];
                    var $hex = $hexes.eq(hex.idx);

                    $hex.children(".middle").html((j - radius) + "," + (i - radius) + 
                                                  //" (" + hex.idx + ") - " + resourceList[hex.idx] +
                                                  " = " + hex.chance);
                    $hex.data("x", (j - radius));
                    $hex.data("y", (i - radius));
                    $hex.data("chance", hex.chance);
                    $hex.addClass(resources[hex.resource]);
                    $hex.addClass("chance-" + hex.chance);
                }
            }
            $hexes.hover(function(){
                var $hex = $(this);
                var hex_x = $hex.data("x");
                var hex_y = $hex.data("y");
                $hexes.removeClass("hover");
                $hexes.removeClass("hover-neighbor");
                $hex.addClass("hover");
                for (var i in neighbors) {
                    var neighbor = neighbors[i];
                    if (isLegal(hex_x + neighbor.x, hex_y + neighbor.y, radius)) {
                        var x = hex_x + neighbor.x + radius;
                        var y = hex_y + neighbor.y + radius;

                        var hex_idx = coords2idx(hex_x + neighbor.x, hex_y + neighbor.y, radius);
                        $hexes.eq(hex_idx).addClass("hover-neighbor");
                    }
                }
            }, function(){
                var $hex = $(this);
                $hexes.removeClass("hover");
                $hexes.removeClass("hover-neighbor");
            });
});
